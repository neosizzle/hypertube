from channels.consumer import AsyncConsumer
from channels.exceptions import StopConsumer
from channels.db import database_sync_to_async
from aiortc import RTCIceCandidate, RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer
from django.utils import timezone
from django.conf import settings
from torrent import TorrentSession

import os
import asyncio
import json
import requests
import zipfile
import ffmpeg
from app_users.models import Session

BYE = object()

# takes a json protocol string and returns serialzied RTCSessionDescription object
def object_from_string(message_str):
    message = json.loads(message_str)
    if message["type"] in ["answer", "offer"]:
        return RTCSessionDescription(**message)
    elif message["type"] == "candidate" and message["candidate"]:
        # We dont handle ICE here
        return BYE
    elif message["type"] == "bye":
        return BYE

# takes a serialzied RTCSessionDescription object and returns json protocol string
def object_to_string(obj):
    if isinstance(obj, RTCSessionDescription):
        message = {"sdp": obj.sdp, "type": obj.type}
    elif isinstance(obj, RTCIceCandidate):
        message = {"type": "bye"} # we dont handle ICE here
    else:
        assert obj is BYE
        message = {"type": "bye"}
    return json.dumps(message, sort_keys=True)

# function to convert SRT subtitle files into VTT subtitle file. 
# VTT format is required for web render. Thnaks ChatGPT
def srt_to_vtt(srt_file, vtt_file):
    # Open the SRT file for reading and the VTT file for writing
    with open(srt_file, 'r', encoding='utf-8') as srt, open(vtt_file, 'w', encoding='utf-8') as vtt:
        # Write the VTT header
        vtt.write('WEBVTT\n\n')

        # Read through each line of the SRT file
        srt_content = srt.read()
        subtitle_blocks = srt_content.strip().split('\n\n')
        
        for block in subtitle_blocks:
            lines = block.split('\n')
            
            # The first line is the subtitle number (ignore it)
            # The second line is the timestamp, we need to convert it
            timestamp = lines[1]
            timestamp = timestamp.replace(',', '.')  # Change comma to dot for VTT format
            
            # The remaining lines are the subtitles
            subtitle_text = '\n'.join(lines[2:])
            
            # Write the converted timestamp and subtitle to the VTT file
            vtt.write(f"{timestamp}\n{subtitle_text}\n\n")

def get_session_user_and_time(token):
    try:
       session = Session.objects.get(token=token)
       return (session.expires_at, session.app_user)
    except:
        return None

# Messaging RFC:
# token|type|payload1|payload2|payload3|payload4|payload5|payload6|payload7
# NOTE: payload needs to have 9 elements
# type must be handshake | video | bye

# Convention for type 'handshake'
# payload1 - RTC handshake data
#
# payload2 - Availability flag
# Allowed values : VASA, VNASNA, VNASA, VASNA
# Explanation: VASA - Video Available Subtitle Available
#              VNASNA - Video NotAvailable Subtitle NotAvailable 
#              VNASA - VideoNotAvailable Subtitle Available
#              VASNA - Video Available Subtitle NotAvailable
#
# payload3 - Video File name (for VA- flags) OR magnet link (for VNA- flags)
# NOTE: Video file name is derived from Video.Torrent.file_name. The signalling service
#       will build the full path based on MEDIA_ROOT server setting
#
# payload4 - Subscene subtitle download link (for -SNA flags) followed by an '@' and the language OR blank value
# NOTE: The signalling service will call a GET request to the link provided
# NOTE: the language paraeter is used for file saving purposes only
# EXAMPLE: https://sub-scene.com/download/3353927@EN
#
# payload5 - File Format Requirement
# Allowed values - mp4, mkv
#
# payload6 - IMDB id
# NOTE: this is used when saving subtitles and mp4 torrents into disk
#
# payload7 - Video size in WIDGTHxHEIGHT or blank
#

# Convention for type 'video'
# payload1 - RTC handshake data

_global = []
some_state = [0]
lock = asyncio.Lock()
# async with lock:

ACCEPTED_MSG_TYPES = ["handshake", "video", "ping"]
ACCEPTED_FLAGS = ["VASA", "VNASNA", "VNASA", "VASNA"]
# 1 new connection will create 1 new consumer
class SignalConsumer(AsyncConsumer):

    def __init__(self, *args, **kwargs):
        self.rtc_client = [None] # list here to prevent GC from freeing the rtcclient object prematurely
        self.local_background_tasks = set()
        self.lock = asyncio.Lock()
        self.current_torrenting_media = None
        self.subtitle_download_done = None
        super().__init__(*args, **kwargs)
        
    async def websocket_connect(self, event):
        await self.send({
            "type": "websocket.accept",
        })

    async def blocking_task(self, data):
        i = 0
        while i < data:
            await asyncio.sleep(1)
            await self.send({
                "type": "websocket.send",
                "text": f"pass|lol|{i}",
            })
            i += 1

    # takes a magnet link as input
    async def stream_torrent(self, magnet_link, imdb_id):
        # Create a session, and add a torrent
        session = TorrentSession()
        save_path = os.path.join(settings.MEDIA_ROOT, f'torrents/{imdb_id}.mp4')
        with session.add_torrent(magnet_link=magnet_link, remove_after=False, save_path=save_path) as torrent:
            # Force sequential mode - data arrives in sequence, required for streaming
            torrent.sequential(True)
            await torrent.wait_for('started')

            # Get first match of a media file
            try:
                media = next(a for a in torrent
                             if a.is_media and not 'sample' in a.path.lower())
                async with self.lock:
                    self.current_torrenting_media = media

                # only exit when media is 100% completed
                await asyncio.gather(media.wait_for_completion(100))
            except StopIteration:
                print("ERROR [stream_torrent] Could not find a playable source'")
            
    # takes a subscene download link as input, will set 
    # self.subtitle_download_done once file is ready to read from disk.
    async def stream_subtitle(self, download_link, imdb_id, lang):
        self.subtitle_download_done = False
        save_path = os.path.join(settings.MEDIA_ROOT, f'subtitles/{imdb_id}.zip')
        extract_folder = os.path.join(settings.MEDIA_ROOT, f'subtitles/{imdb_id}/')
        extract_path = os.path.join(settings.MEDIA_ROOT, f'subtitles/{imdb_id}.srt')
        convert_path = os.path.join(settings.MEDIA_ROOT, f'subtitles/{imdb_id}{lang}.vtt')
        response = requests.get(download_link)
        if response.status_code != 200:
            print(f"ERROR [stream_subtitle] Subtitle download failed wtih code {response.status_code}")
            return
        
        # write to zip file
        with open(save_path, 'wb') as f:
            f.write(response.content)

        with zipfile.ZipFile(save_path, 'r') as zip_ref:
            # get the .srt filename
            file_name = zip_ref.namelist()[0]
            
            # extract the contents of the zip file into a folder
            # this is an unecassary indirection, but i lazy to optimize
            zip_ref.extract(file_name, extract_folder)
            
            # Rename the extracted filr
            old_file_path = os.path.join(extract_folder, file_name)
            new_file_path = extract_path
            os.rename(old_file_path, new_file_path)

            #conversion from srt to vtt
            srt_to_vtt(extract_path, convert_path)

            # delete intermediate files
            os.rmdir(extract_folder)
            os.remove(zip_ref.filename)
            os.remove(extract_path)

        self.subtitle_download_done = True
        return
    
    async def mp4_to_mkv(self, mp4_path, out_name, token):
        try:
            await asyncio.to_thread(ffmpeg.input(mp4_path).output(out_name, y=None).run, quiet=True)
        except Exception as e:
            print(e)
            await self.send({
                    "type": "websocket.send",
                    "text": f"{token}|error|{e}",
                })
            return

    async def websocket_disconnect(self, event):
        raise StopConsumer

    # TODO error handling 
    async def websocket_receive(self, event):
        data_sections = event['text'].split('|')
        token = None
        try:
            token = data_sections[0]
        except Exception as e :
            await self.send({
                "type": "websocket.send",
                "text": f"pass|error|{e}",
            })
            return

        # check for valid RFC section count
        if len(data_sections) != 9:
            await self.send({
                "type": "websocket.send",
                "text": f"{token}|error|Invalid message formatting: received only {len(data_sections)} sections",
            })
            await self.send({
                "type": "websocket.close",
                "code": 3003
            })
            return

        # check for valid id against database
        # backdoor for test, userid == 'pass'
        user = None
        if token != "pass":
            user_and_time_pair = await database_sync_to_async(get_session_user_and_time)(token)
            if user_and_time_pair is None or user_and_time_pair[0] > timezone.now():
                await self.send({
                "type": "websocket.send",
                "text": f"{token}|error|Invalid token",
                })
                await self.send({
                "type": "websocket.close",
                "code": 3000
                })
                return
            user = user_and_time_pair[1]
        
        # check message type
        msg_type = data_sections[1]
        if msg_type not in ACCEPTED_MSG_TYPES:
            await self.send({
                "type": "websocket.send",
                "text": f"{token}|error|Invalid message type: {msg_type}",
            })
            await self.send({
            "type": "websocket.close",
            "code": 3003
            })
            return
        

        # handle handshake type
        if msg_type == "handshake":
            handshake_data = data_sections[2]
            flags = data_sections[3]

            # validate flags are accepted
            if flags not in ACCEPTED_FLAGS:
                await self.send({
                    "type": "websocket.send",
                    "text": f"{token}|error|Invalid flags: {flags}",
                })
                await self.send({
                    "type": "websocket.close",
                    "code": 3003
                    })
                return

            # create new rtc client
            pc = RTCPeerConnection()
            
            # use object_from_string(message_str) To generate session descriptions.
            session_desc = object_from_string(handshake_data)
            
            # then use pc.setRemoteDescription(obj) to accept offer.
            await pc.setRemoteDescription(session_desc)

			# remember to pc.setLocalDescription(await pc.createAnswer()) when creating answer back to client
            await pc.setLocalDescription(await pc.createAnswer())
            
            # can access offer answer using pc.localDescription. we should send this back to client via ws
            answer_to_send = object_to_string(pc.localDescription)
            await self.send({
                "type": "websocket.send",
                "text": f"{token}|handshake|{answer_to_send}",
            })

            # wait for some time for client to recv
            # NOTE: for good practice, we should return here and use another message as ACK, but
            # this can do for now.
            await asyncio.sleep(0.5)

            # check video not available flag
            media_file_path = None
            if "VNA" in flags:
                # magnet = data_sections[4]
                # imdb_id = data_sections[7]
                imdb_id = 69420
                magnet = "magnet:?xt=urn:btih:59756CEF987CD5E06E4293E2CF3AF3AA71AD193A&dn=Aussie.Gold.Hunters.S10E01.WEBRip.x264-skorpion&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.uw0.xyz%3A6969%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.tiny-vps.com%3A6969%2Fannounce&tr=udp%3A%2F%2Fopen.demonii.si%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.kamigami.org%3A2710%2Fannounce&tr=udp%3A%2F%2Fopentor.org%3A2710%2Fannounce%5B%2Ffo&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.zerobytes.xyz%3A1337%2Fannounce&tr=udp%3A%2F%2Faaa.army%3A8866%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=http%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fcoppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.zer0day.to%3A1337%2Fannounce"
                task = asyncio.create_task(self.stream_torrent(magnet, imdb_id))
                self.local_background_tasks.add(task)
                task.add_done_callback(self.local_background_tasks.discard)

                # keep waiting until current media is ready
                time_left = 20
                while True:
                    await asyncio.sleep(5)
                    time_left -= 1
                    async with lock:
                        if self.current_torrenting_media != None:
                            media_file_path = self.current_torrenting_media.path
                            break
                        else :
                            if time_left == 0:
                                await self.send({
                                    "type": "websocket.send",
                                    "text": f"{token}|error|Timeout when downloading metadata",
                                })
                                return
                            print(f"still waiting for media torrent to start.. timeout in {time_left * 5} seconds")

            if "VA" in flags:
                media_file_path = data_sections[4]

            if "SNA" in flags:
                # imdb_id = data_sections[7]
                # download_link_w_lang = data_sections[5]
                download_link_w_lang = "https://sub-scene.com/download/3353927@EN"
                download_link,lang = download_link_w_lang.split('@')
                imdb_id = 69420
                task = asyncio.create_task(self.stream_subtitle(download_link, imdb_id, lang))
                self.local_background_tasks.add(task)
                task.add_done_callback(self.local_background_tasks.discard)


            # wait for subtitles fully processed
            if self.subtitle_download_done != None:
                await asyncio.sleep(0.5)
                print("SUBTITLE waiting for completion")

            # wait for video to be at least 20% done
            if self.current_torrenting_media != None:
                print(f"MEDIA {self.current_torrenting_media.path} init, waiting for 20%")
                # wait until the download is finiished at least 20%
                await self.current_torrenting_media.wait_for_completion(20)

            # if the conversion flag is to mkv is set. If it is, start converion process
            # and wait for the conversion process until the output file exists (?)
            conversion = data_sections[6]
            if conversion == "mkv":
                mp4_path = os.path.join(settings.MEDIA_ROOT, f'torrents/{media_file_path}')
                name, ext = os.path.splitext(mp4_path)
                out_name = name + ".mkv"

                task = asyncio.create_task(self.mp4_to_mkv(mp4_path, out_name, token))
                self.local_background_tasks.add(task)
                task.add_done_callback(self.local_background_tasks.discard)

                # NOTE: wait for conversion to at least complete header. bad practice for arb wait here
                # TODO: implement dynamic progress checking. (Low priority)
                await asyncio.sleep(5)
                while not os.path.exists(out_name):
                    await asyncio.sleep(1)
                    print(f"FFMPEG waiting for mkv conversion to finish")
                media_file_path = os.path.splitext(media_file_path)[0] + ".mkv"

            file_path = os.path.join(settings.MEDIA_ROOT, f'torrents/{media_file_path}')

            if not os.path.exists(file_path):
                await self.send({
                    "type": "websocket.send",
                    "text": f"{token}|error|{file_path} not found in media",
                })
                return
            
            player = MediaPlayer(file_path)
            video_size = data_sections[8]
            if video_size != '':
                player = MediaPlayer(file_path, loop=True, options={'video_size': video_size})
            
            if player and player.audio:
                pc.addTrack(player.audio)

            if player and player.video:
                pc.addTrack(player.video)
            
            # create new offer to negotiate video codec
            # https://stackoverflow.com/questions/78182143/webrtc-aiortc-addtrack-failing-inside-datachannel-message-receive-handler
            await pc.setLocalDescription(await pc.createOffer())
            nego_to_send = object_to_string(pc.localDescription)         
            await self.send({
                "type": "websocket.send",
                "text": f"{token}|video|{nego_to_send}",
            }) # NOTE: use datachannel here?

            # add client to member refrence
            self.rtc_client[0] = pc
        elif msg_type == "video":
            handshake_data = data_sections[2]
            # handle message where client ack our video negotiation
            pc = self.rtc_client[0]
            session_desc = object_from_string(handshake_data)
            await pc.setRemoteDescription(session_desc)
        elif msg_type == "ping":
             await self.send({
                "type": "websocket.send",
                "text": f"{token}|pong|",
            }) 