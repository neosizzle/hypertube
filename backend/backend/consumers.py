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
import websockets
import json
import time 

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


def get_session_user_and_time(token):
    try:
       session = Session.objects.get(token=token)
       return (session.expires_at, session.app_user)
    except:
        return None

# Messaging RFC:
# token|type|payload1|payload2|payload3|payload4
# NOTE: payload needs to have 6 elements
# type must be handshake | video | bye

_global = []
some_state = [0]
lock = asyncio.Lock()
# async with lock:

ACCEPTED_MSG_TYPES = ["handshake", "video", "ping"]

# 1 new connection will create 1 new consumer
class SignalConsumer(AsyncConsumer):

    def __init__(self, *args, **kwargs):
        self.rtc_client = [None] # list here to prevent GC from freeing the rtcclient object prematurely
        self.local_background_tasks = set()
        self.lock = asyncio.Lock()
        self.current_media = None
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
    async def stream_torrent(self, magnet_link):
        # Create a session, and add a torrent
        session = TorrentSession()
        save_path = os.path.join(settings.MEDIA_ROOT, 'torrents/')
        with session.add_torrent(magnet_link=magnet_link, remove_after=False, save_path=save_path) as torrent:
            # Force sequential mode - data arrives in sequence, required for streaming
            torrent.sequential(True)
            await torrent.wait_for('started')

            # Get first match of a media file
            try:
                media = next(a for a in torrent
                             if a.is_media and not 'sample' in a.path.lower())
                async with self.lock:
                    self.current_media = media
                # only exit when media is 100% completed
                await asyncio.gather(media.wait_for_completion(100))
            except StopIteration:
                raise Exception('Could not find a playable source')
    
    async def websocket_disconnect(self, event):
        raise StopConsumer

    async def websocket_receive(self, event):
        data_sections = event['text'].split('|')

        # check for valid RFC section count
        if len(data_sections) != 6:
            await self.send({
            "type": "websocket.close",
            "reason": f"Invalid message formatting: received only {len(data_sections)} sections",
            "code": 3003
            })
            return

        # check for validid against database
        # backdoor for test, userid == 'pass'
        token = data_sections[0]
        user = None
        if token != "pass":
            user_and_time_pair = await database_sync_to_async(get_session_user_and_time)(token)
            if user_and_time_pair is None or user_and_time_pair[0] > timezone.now():
                await self.send({
                "type": "websocket.close",
                "reason": f"Invalid token",
                "code": 3000
                })
                return
            user = user_and_time_pair[1]
        
        # check message type
        msg_type = data_sections[1]
        if msg_type not in ACCEPTED_MSG_TYPES:
            await self.send({
            "type": "websocket.close",
            "reason": f"Invalid message type: {msg_type}",
            "code": 3003
            })
            return
        

        # handle handshake type
        if msg_type == "handshake":
            handshake_data = data_sections[2]
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

            # TODO check if we really need to torrent. If we dont, set current_media 
            # to the video file which we already have
            # TODO specify torrent details in handshake payload

            # and maybe wait till video is 20% done torrenting?
            magnet = "magnet:?xt=urn:btih:59756CEF987CD5E06E4293E2CF3AF3AA71AD193A&dn=Aussie.Gold.Hunters.S10E01.WEBRip.x264-skorpion&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.uw0.xyz%3A6969%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.tiny-vps.com%3A6969%2Fannounce&tr=udp%3A%2F%2Fopen.demonii.si%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.kamigami.org%3A2710%2Fannounce&tr=udp%3A%2F%2Fopentor.org%3A2710%2Fannounce%5B%2Ffo&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.zerobytes.xyz%3A1337%2Fannounce&tr=udp%3A%2F%2Faaa.army%3A8866%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=http%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fcoppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.zer0day.to%3A1337%2Fannounce"
            task = asyncio.create_task(self.stream_torrent(magnet))
            self.local_background_tasks.add(task)
            task.add_done_callback(self.local_background_tasks.discard)

            # keep waiting until current media is ready
            # TODO: Add abort timeout perhaps?
            while True:
                await asyncio.sleep(5)
                async with lock:
                    if self.current_media != None:
                        print(f"MEDIA {self.current_media.path} init, waiting for 20%")

                        # wait until the download is finiished at least 20%
                        await self.current_media.wait_for_completion(20)

                        file_path = os.path.join(settings.MEDIA_ROOT, f'torrents/{self.current_media.path}')
                        player = MediaPlayer(file_path, loop=True)
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
                        break
                    else :
                        print("still waiting for media to not be none...")

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