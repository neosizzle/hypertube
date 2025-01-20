import asyncio
import websockets
import json
import time 

from aiortc import RTCIceCandidate, RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer

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

async def echo(websocket):
    clients = []
    try:
        async for message in websocket:
            # ws messaged received, filter
            (msg_type, content) = message.split("|")
            # print(f"Received message: {content}")

            if msg_type == "handshake":
                # rtc client here
                # aiortc create new client, dw about signalling
                pc = RTCPeerConnection()

                # TODO: handle bye message

                @pc.on("track")
                def on_track(track):
                    print("Receiving %s" % track.kind)

                # use object_from_string(message_str) To generate session descriptions.
                session_desc = object_from_string(content)

                # then use pc.setRemoteDescription(obj) to accept offer.
                await pc.setRemoteDescription(session_desc)

                # remember to pc.setLocalDescription(await pc.createAnswer()) when creating answer back to client
                await pc.setLocalDescription(await pc.createAnswer())

                # can access offer answer using pc.localDescription. we should send this back to client via ws
                answer_to_send = object_to_string(pc.localDescription)
                await websocket.send(f"handshake|{answer_to_send}")

                # wait for some time for client to recv
                time.sleep(0.1)

                # TODO torrent here
                player = MediaPlayer("src.mp4")
                if player and player.audio:
                    pc.addTrack(player.audio)

                if player and player.video:
                    pc.addTrack(player.video)

                # create new offer to negotiate video codec
                # https://stackoverflow.com/questions/78182143/webrtc-aiortc-addtrack-failing-inside-datachannel-message-receive-handler
                await pc.setLocalDescription(await pc.createOffer())
                nego_to_send = object_to_string(pc.localDescription)         
                await websocket.send(f"video|{nego_to_send}") # NOTE: use datachannel here?

                # add client to global refrence
                clients.append(pc)
            
            elif msg_type == "video":
                # handle message where client ack our video negotiation
                pc = clients[0]
                session_desc = object_from_string(content)
                await pc.setRemoteDescription(session_desc)
            
            else:
                print(f"unknown message type {type}")


    except websockets.exceptions.ConnectionClosed as e:
        print(f"Connection closed: {e}")

async def main():
    server = await websockets.serve(echo, "localhost", 8765)
    print("WebSocket server running on ws://localhost:8765")
    await server.wait_closed()

asyncio.run(main())
