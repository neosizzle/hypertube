from channels.consumer import AsyncConsumer
from channels.exceptions import StopConsumer
from channels.db import database_sync_to_async
from aiortc import RTCIceCandidate, RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer
from django.utils import timezone

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
# type must be handshake | video | bye

_global = []
some_state = [0]
lock = asyncio.Lock()
# async with lock:

ACCEPTED_MSG_TYPES = ["handshake", "video", "bye"]

class EchoConsumer(AsyncConsumer):
    async def websocket_connect(self, event):
        await self.send({
            "type": "websocket.accept",
        })
    
    async def websocket_disconnect(self, event):
        raise StopConsumer

    async def websocket_receive(self, event):
        data_sections = event['text'].split('|')

        # check for valid RFC section count
        if len(data_sections) != 4:
            await self.send({
            "type": "websocket.close",
            "reason": f"Invalid message formatting: received only {len(data_sections)} sections",
            "code": 3003
            })
            return

        # check for validid against database
        # backdoor for test, userid == 'token'
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
        msg_type = data_sections[0]
        if msg_type not in ACCEPTED_MSG_TYPES:
            await self.send({
            "type": "websocket.close",
            "reason": f"Invalid message type: {msg_type}",
            "code": 3003
            })
            return
        
        # TODO: implement RTC client here
        _global.append(some_state[0])
        some_state[0] += 1 
        await self.send({
            "type": "websocket.send",
            "text": f"_global {_global} {event}",
        })