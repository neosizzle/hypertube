from channels.consumer import AsyncConsumer
from channels.exceptions import StopConsumer
from channels.db import database_sync_to_async
from aiortc import RTCIceCandidate, RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer
from django.utils import timezone
from django.conf import settings

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

ACCEPTED_MSG_TYPES = ["handshake", "video", "bye"]

# 1 new connection will create 1 new consumer
class SignalConsumer(AsyncConsumer):

    def __init__(self, *args, **kwargs):
        self.rtc_client = [] # list here to prevent GC from freeing the rtcclient object prematurely

        super().__init__(*args, **kwargs)
        
    async def websocket_connect(self, event):
        await self.send({
            "type": "websocket.accept",
        })
    
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
            time.sleep(0.5)

            # TODO torrent here in background using asyncio.create_task
            # TODO specify torrent details in handshake payload
            # and maybe wait till video is 20% done torrenting?
            file_path = os.path.join(settings.MEDIA_ROOT, 'torrents/src.mp4')

            player = MediaPlayer(file_path)
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
            self.rtc_client.append(pc)
        elif msg_type == "video":
            handshake_data = data_sections[2]
            # handle message where client ack our video negotiation
            pc = self.rtc_client[0]
            session_desc = object_from_string(handshake_data)
            await pc.setRemoteDescription(session_desc)