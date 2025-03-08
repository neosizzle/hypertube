from channels.consumer import AsyncConsumer
from channels.exceptions import StopConsumer
from channels.db import database_sync_to_async
from aiortc import RTCIceCandidate, RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer
from django.utils import timezone
from django.conf import settings
from torrent import TorrentSession

import re
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
        
        i = 1
        for block in subtitle_blocks:
            lines = block.split('\n')
            
            # The first line is the subtitle number (ignore it)
            # The second line is the timestamp, we need to convert it
            timestamp = lines[1]
            timestamp = timestamp.replace(',', '.')  # Change comma to dot for VTT format
            
            # The remaining lines are the subtitles
            subtitle_text = '\n'.join(lines[2:])
            
            # Write the converted timestamp and subtitle to the VTT file
            vtt.write(f"{i}\n{timestamp}\n{subtitle_text}\n\n")
            i += 1

def get_session_user_and_time(token):
    try:
       session = Session.objects.get(token=token)
       return (session.expires_at, session.app_user)
    except:
        return None

# Messaging RFC:
# token|type|payload1|payload2|payload3|payload4|payload5|payload6|payload7
# NOTE: payload needs to have 9 elements
# type must be handshake | video | custom_sub

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
# NOTE: this is used when saving subtitles and video torrents into disk
#
# payload7 - Video size in WIDGTHxHEIGHT or blank
#

# Convention for type 'video'
# payload1 - RTC handshake data

# Convention for type 'custom_sub'
# this type is made as a duct tape patch for the user to manually download additional subtitles
# payload1 - Same as payload4 for type 'handshake': Subscene subtitle download link (for -SNA flags) followed by an '@' and the language OR blank value
# NOTE: The signalling service will call a GET request to the link provided
# NOTE: the language paraeter is used for file saving purposes only
# EXAMPLE: https://sub-scene.com/download/3353927@
#
# payload2 - IMDB id

_global = []
some_state = [0]
lock = asyncio.Lock()
# async with lock:

ACCEPTED_MSG_TYPES = ["handshake", "video", "ping", "custom_sub"]
ACCEPTED_FLAGS = ["VASA", "VNASNA", "VNASA", "VASNA"]
ACCEPTED_SIZE_FLAGS = ["", "0", "1", "2"]
VIDEO_SIZE_MAP = {
    '0': "858x480",
    '1': "1280x720",
    '2': "1920x1080"
}
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
    async def stream_torrent(self, magnet_link, imdb_id, token):
        # Create a session, and add a torrent
        session = TorrentSession()
        save_path = os.path.join(settings.MEDIA_ROOT, f'torrents/{imdb_id}') # all file contents go into imdb_id folder
        with session.add_torrent(magnet_link=magnet_link, remove_after=False, save_path=save_path) as torrent:
            # Force sequential mode - data arrives in sequence, required for streaming
            torrent.sequential(True)
            await torrent.wait_for('started')

            # Get first match of a media file
            try:
                media = next(a for a in torrent
                             if a.is_media and not 'sample' in a.path.lower())
                async with self.lock:
                    # send socket message to inform frontend on path name so they can save to db
                    # unessacary indirection, better way is to save it directly here
                    final_media_path = f"{imdb_id}/{media.path}"
                    await self.send({
                        "type": "websocket.send",
                        "text": f"{token}|info|{final_media_path}",
                    })
                    self.current_torrenting_media = media

                # only exit when media is 100% completed
                await asyncio.gather(media.wait_for_completion(100))
            except StopIteration:
                print("ERROR [stream_torrent] Could not find a playable source'")
            
    # takes a subscene download link as input, will set 
    # self.subtitle_download_done once file is ready to read from disk.
    async def stream_subtitle_subscene(self, download_link, imdb_id, lang):
        self.subtitle_download_done = False
        save_path = os.path.join(settings.MEDIA_ROOT, f'subtitles/{imdb_id}.zip')
        extract_folder = os.path.join(settings.MEDIA_ROOT, f'subtitles/{imdb_id}/')
        extract_path = os.path.join(settings.MEDIA_ROOT, f'subtitles/{imdb_id}.srt')
        convert_path = os.path.join(settings.MEDIA_ROOT, f'subtitles/{imdb_id}{lang}.vtt')
        response = requests.get(download_link)
        if response.status_code != 200:
            print(f"ERROR [stream_subtitle_subscene] Subtitle download failed wtih code {response.status_code}")
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
    
    # takes a opensub download link as input, will set 
    # self.subtitle_download_done once file is ready to read from disk.
    async def stream_subtitle_opensub(self, download_link, imdb_id, lang):
        self.subtitle_download_done = False
        save_path = os.path.join(settings.MEDIA_ROOT, f'subtitles/{imdb_id}{lang}.webvtt')
        response = requests.get(download_link)
        if response.status_code != 200:
            print(f"ERROR [stream_subtitle_opensub] Subtitle download failed wtih code {response.status_code}")
            return
        
        # write to zip file
        with open(save_path, 'wb') as f:
            f.write(response.content)

        self.subtitle_download_done = True
        return
    
    async def mkv_reduce_stream(self, in_name, out_name, token):
        print(f"ffmpeg conversion start ffmpeg -i '{in_name}' -map 0:a:0 -map 0:v:0 -c copy '{out_name}'")
        cmd =  f"ffmpeg -i '{in_name}' -map 0:a:0 -map 0:v:0 -s 1280x720 -c copy '{out_name}' -y"
        proc = await asyncio.create_subprocess_shell(
        cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE)

        stdout, stderr = await proc.communicate()

        print(f'[ffmpeg exited with {proc.returncode}]')
        if proc.returncode != 0:
            await self.send({
                    "type": "websocket.send",
                    "text": f"{token}|error|mkv stream reducing error",
                })
            if stdout:
                print(f'[stdout]\n{stdout.decode()}')
            if stderr:
                print(f'[stderr]\n{stderr.decode()}')

    async def ffmpeg_convert(self, in_name, out_name, token):
        try:
            await asyncio.to_thread(ffmpeg
                                    .input(in_name)
                                    .output(out_name, y=None, video_bitrate=17000, audio_bitrate=17000, r=30, ac=2, s="1280x720", speed=12, acodec="libopus", vcodec="libvpx",)
                                    .run, quiet=False)
        except Exception as e:
            print(e)
            await self.send({
                    "type": "websocket.send",
                    "text": f"{token}|error|{e}",
                })
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
        if self.rtc_client[0] != None:
            await self.rtc_client[0].close()
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
            video_size = data_sections[8]

            # validate flags are accepted
            if flags not in ACCEPTED_FLAGS or video_size not in ACCEPTED_SIZE_FLAGS:
                await self.send({
                    "type": "websocket.send",
                    "text": f"{token}|error|Invalid flags: {flags} or video size {video_size}",
                })
                await self.send({
                    "type": "websocket.close",
                    "code": 3003
                    })
                return

            # create new rtc client
            pc = RTCPeerConnection()

            # add client to member refrence
            self.rtc_client[0] = pc
            
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
            await asyncio.sleep(1)

            # check video not available flag
            media_file_path = None
            if "VNA" in flags:
                magnet = data_sections[4]
                imdb_id = data_sections[7]
                # imdb_id = 69420
                # magnet = "magnet:?xt=urn:btih:4b37ff0e0edc511bd96448c0039c0f7a9913ac4e&dn=%5BJudas%5D%20Kimi%20no%20Na%20Wa.%20%28Your%20Name.%29%20%5BBD%202160p%204K%20UHD%5D%5BHEVC%20x265%2010bit%5D%5BDual-Audio%5D%5BMulti-Subs%5D&tr=http%3A%2F%2Fnyaa.tracker.wf%3A7777%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce"
                task = asyncio.create_task(self.stream_torrent(magnet, imdb_id, token))
                self.local_background_tasks.add(task)
                task.add_done_callback(self.local_background_tasks.discard)

                # keep waiting until current media is ready
                time_left = 20
                while True:
                    await asyncio.sleep(5)
                    time_left -= 1
                    async with lock:
                        if self.current_torrenting_media != None:
                            media_file_path = f"{imdb_id}/{self.current_torrenting_media.path}"
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

            # if "SNA" in flags:
            #     # imdb_id = data_sections[7]
            #     # download_link_w_lang = data_sections[5]
            #     download_link_w_lang = "https://sub-scene.com/download/3353927@EN"
            #     download_link,lang = download_link_w_lang.split('@')
            #     imdb_id = 69420
            #     task = asyncio.create_task(self.stream_subtitle_subscene(download_link, imdb_id, lang))
            #     self.local_background_tasks.add(task)
            #     task.add_done_callback(self.local_background_tasks.discard)


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
            # NOTE: not needed, mediastream is insensitive to video format

            # conversion = data_sections[6]
            # if conversion == "mkv":
            #     mp4_path = os.path.join(settings.MEDIA_ROOT, f'torrents/{media_file_path}')
            #     name, ext = os.path.splitext(mp4_path)
            #     out_name = name + ".mkv"

            #     task = asyncio.create_task(self.mp4_to_mkv(mp4_path, out_name, token))
            #     self.local_background_tasks.add(task)
            #     task.add_done_callback(self.local_background_tasks.discard)

            #     # NOTE: wait for conversion to at least complete header. bad practice for arb wait here
            #     # TODO: implement dynamic progress checking. (Low priority)
            #     await asyncio.sleep(5)
            #     while not os.path.exists(out_name):
            #         await asyncio.sleep(1)
            #         print(f"FFMPEG waiting for mkv conversion to finish")
            #     media_file_path = os.path.splitext(media_file_path)[0] + ".mkv"

            # # since mkv is a container of multiple streams and we might OOM
            # # convert the media file to single stream mkv before streaming
            # original_path = os.path.join(settings.MEDIA_ROOT, f'torrents/{media_file_path}')
            # name, ext = os.path.splitext(original_path)
            # if ext == ".mkv":
            #     file_path_tokens = original_path.split("/")
            #     file_path_tokens[-1] = "converted.mkv"
            #     out_name = "/".join(file_path_tokens)

            #     task = asyncio.create_task(self.mkv_reduce_stream(original_path, out_name, token))
            #     self.local_background_tasks.add(task)
            #     task.add_done_callback(self.local_background_tasks.discard)

            #     # NOTE: wait for conversion to at least complete header. bad practice for arb wait here
            #     # TODO: implement dynamic progress checking. (Low priority)
            #     # maybe wait for webm file size to be atleast half to torrent total size?
            #     await asyncio.sleep(5)

            #     file_path_tokens = media_file_path.split("/")
            #     file_path_tokens[-1] = "converted.mkv"
            #     media_file_path = "/".join(file_path_tokens)
                
            #     # send info message to client, if we are in this branch, this sould be our first time sending
            #     final_media_path = out_name
            #     await self.send({
            #         "type": "websocket.send",
            #         "text": f"{token}|info|{final_media_path}",
            #     })

            file_path = os.path.join(settings.MEDIA_ROOT, f'torrents/{media_file_path}')

            if not os.path.exists(file_path):
                await self.send({
                    "type": "websocket.send",
                    "text": f"{token}|error|{file_path} not found in media",
                })
                return
            
            print(f"===streaming {file_path}")
            player = MediaPlayer(file_path)
            if video_size != '':
                player = MediaPlayer(file_path, options={'video_size': VIDEO_SIZE_MAP[video_size],})
            
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

            # # add client to member refrence
            # self.rtc_client[0] = pc
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
        elif msg_type == "custom_sub":
            imdb_id = data_sections[3]
            # imdb_id = 69420
            download_link_w_lang = data_sections[2]
            # download_link_w_lang = "https://www.opensubtitles.com/download/A8F74F0F621F86E5E6F0681C794576A3DAAE914B960E113209A89A386D515273EB532846B98A24E7D0CF358BD23BB9073E3A17CDB351772E2240E3BF66C7AC8D8B560BD7D071EADBC838B7F21CB5422AE5FBCF7B14234699A2A9EFD937338498E2B14200FF423E9617587FC520BB3FE12F26B8271CD3488C33DC1E4491A5A24F205EF72D165C101D75F6EBE431690436D24298367BDB8C996F62CF7707F49A7F2021663769380AB3A2E07817245A0B7511E05EF40501C5607BE3D30525C92D5C34D3A7701CB5B946A0B1DB9AF61CF9D9EC793044981D0A925BC4B3DCAB6745ED09DA5642EDA23E12BD5D0337695FAD3A5A511A9891FFE362621F310190AA38218FCC397A9C8F5AF17B4F83637DC94D26/subfile/test.webvtt@en"
            download_link,lang = download_link_w_lang.split('@')
            task = asyncio.create_task(self.stream_subtitle_opensub(download_link, imdb_id, lang))
            self.local_background_tasks.add(task)
            task.add_done_callback(self.local_background_tasks.discard)

            # wait for subtitles fully processed
            if self.subtitle_download_done != None:
                await asyncio.sleep(5)
                print("SUBTITLE waiting for completion")

            await self.send({
                "type": "websocket.send",
                "text": f"{token}|custom_sub|{lang}", # user will construct path
            })