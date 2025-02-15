'use client';

import React, { useRef, useState, useEffect } from 'react';
import Peer from 'simple-peer';

export default function Home() {
  const connectionRef = useRef<any>(null);
  const wsRef = useRef<any>(null);
  const connectedStateRef = useRef(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleClick = () => {

    if (wsRef.current != null)
    {
      alert("sd ada ws lah babi")
      return
    }

    // socket connect
    const socket = new WebSocket('ws://localhost:8000/ws/signalling/');
    socket.onopen = () => {
      
      // create rtc peer
      const peer = new Peer({ initiator: true, trickle: false });

      peer.on('signal', (data) => {
        // we are the initiator here, this would get called after creation OR ack video
        // for init, 'data' will contain an offer msg that needs to be sent to signalling server and hopefully receive the same signalling text
        const data_str = JSON.stringify(data)
        if (!connectedStateRef.current)
          socket.send(`pass|handshake|${data_str}|VNASNA|src.mp4|subscne|mkv|imdb_id|`)

        // for ack video, 'data will contain ack message
        else
          socket.send(`pass|video|${data_str}|asd|asd|ada|asd||`)

        alert(`peer signal, connected? ${connectedStateRef.current}`)
      });

      peer.on('connect', () => {
        connectedStateRef.current = true
        alert('remote peer connect')
      })

      peer.on('stream', (currentStream) => {
        console.log(currentStream)
        setStream(currentStream)
        alert('peer stream')
      });

      peer.on('close', () => {
        alert('remote peer close')
      })

      peer.on('error', (e) => {
        alert('remote peer error')
        console.log(e.code)
      })

      // TODO: add a message handler for datachannel.

      connectionRef.current = peer;
      
    }

    socket.onmessage = (event) => {
      const tokens = event.data.split("|");
      const type = tokens[1]
      const message = tokens[2]
      console.log('Message from server:', message);

      if (type == "handshake") {
        // we should have an answer here. 
        // use the connectionref to ack that answer using peer.signal()
        connectionRef.current.signal(message) // at this point, the peers are connected
      }

      if (type == "video") {
        // this is sent my server to negotiate video codec stuff
        // https://stackoverflow.com/questions/78182143/webrtc-aiortc-addtrack-failing-inside-datachannel-message-receive-handler
        connectionRef.current.signal(message) // we are acking video here 
      }
      
    };

    socket.onclose = (what) => {
      console.log(`WebSocket connection closed`);
      console.log(what)
    };
  
    wsRef.current = socket;

  };

  return (
    <div>
      <h1>Press start to begin RTC flow</h1>
      <button onClick={handleClick}>Start</button>
      <MediaStreamPlayer stream={stream} />
    </div>
  );
}

interface MediaStreamPlayerProps {
  stream: MediaStream | null; // Prop to receive the MediaStream from the parent
}

const MediaStreamPlayer: React.FC<MediaStreamPlayerProps> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showControls, setshowControls] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }

    // Cleanup when component unmounts or stream changes
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        setshowControls(true)
      }
    };
  }, [stream]);

  return (
    <div>
      <video
        controls={true}
        ref={videoRef}
        style={{ width: '50%', height: 'auto', border: '1px solid black' }}
      />
    </div>
  );
};
