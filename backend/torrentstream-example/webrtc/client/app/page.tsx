'use client';

import React, { useRef, useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import Peer from 'simple-peer';

export default function Home() {
  const connectionRef = useRef<any>(null);
  const { sendMessage, lastMessage, readyState } = useWebSocket('ws://localhost:8000/ws/signalling/');
  const connectedStateRef = useRef(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (lastMessage == null || !init)
        return
    const tokens = lastMessage.data.split("|");
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

    if (type == "info") {
      alert(message)
    }
    
  }, [lastMessage, init]);

  useEffect(() => {
    if (readyState != ReadyState.OPEN || !init)
      return
    
    // create rtc peer
    const peer = new Peer({ initiator: true, trickle: false });

    peer.on('signal', (data) => {
      // we are the initiator here, this would get called after creation OR ack video
      // for init, 'data' will contain an offer msg that needs to be sent to signalling server and hopefully receive the same signalling text
      console.log(data)
      const data_str = JSON.stringify(data)
      if (!connectedStateRef.current)
        sendMessage(`pass|handshake|${data_str}|VNASNA|magnet:?xt=urn:btih:4b37ff0e0edc511bd96448c0039c0f7a9913ac4e&dn=%5BJudas%5D%20Kimi%20no%20Na%20Wa.%20%28Your%20Name.%29%20%5BBD%202160p%204K%20UHD%5D%5BHEVC%20x265%2010bit%5D%5BDual-Audio%5D%5BMulti-Subs%5D&tr=http%3A%2F%2Fnyaa.tracker.wf%3A7777%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce|subscne|mkv|imdb_id|2`)

      // for ack video, 'data will contain ack message
      else
        sendMessage(`pass|video|${data_str}|asd|asd|ada|asd||`)

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
      console.log(e)
    })

    // TODO: add a message handler for datachannel.

    connectionRef.current = peer;
    
  }, [readyState, init])

  const handleClick = () => {

    if (init)
    {
      alert("sd ada ws lah babi")
      return
    }

    setInit(true)

    // socket connect
    // const socket = new WebSocket('ws://localhost:8000/ws/signalling/');
    // socket.onopen = () => {
      
    //   // create rtc peer
    //   const peer = new Peer({ initiator: true, trickle: false });

    //   peer.on('signal', (data) => {
    //     // we are the initiator here, this would get called after creation OR ack video
    //     // for init, 'data' will contain an offer msg that needs to be sent to signalling server and hopefully receive the same signalling text
    //     const data_str = JSON.stringify(data)
    //     if (!connectedStateRef.current)
    //       socket.send(`pass|handshake|${data_str}|VASNA|src.mov|subscne|mkv|imdb_id|`)

    //     // for ack video, 'data will contain ack message
    //     else
    //       socket.send(`pass|video|${data_str}|asd|asd|ada|asd||`)

    //     alert(`peer signal, connected? ${connectedStateRef.current}`)
    //   });

    //   peer.on('connect', () => {
    //     connectedStateRef.current = true
    //     alert('remote peer connect')
    //   })

    //   peer.on('stream', (currentStream) => {
    //     console.log(currentStream)
    //     setStream(currentStream)
    //     alert('peer stream')
    //   });

    //   peer.on('close', () => {
    //     alert('remote peer close')
    //   })

    //   peer.on('error', (e) => {
    //     alert('remote peer error')
    //     console.log(e.code)
    //   })

    //   // TODO: add a message handler for datachannel.

    //   connectionRef.current = peer;
      
    // }

    // socket.onmessage = (event) => {
    //   const tokens = event.data.split("|");
    //   const type = tokens[1]
    //   const message = tokens[2]
    //   console.log('Message from server:', message);

    //   if (type == "handshake") {
    //     // we should have an answer here. 
    //     // use the connectionref to ack that answer using peer.signal()
    //     connectionRef.current.signal(message) // at this point, the peers are connected
    //   }

    //   if (type == "video") {
    //     // this is sent my server to negotiate video codec stuff
    //     // https://stackoverflow.com/questions/78182143/webrtc-aiortc-addtrack-failing-inside-datachannel-message-receive-handler
    //     connectionRef.current.signal(message) // we are acking video here 
    //   }

    //   if (type == "info") {
    //     alert(message)
    //   }
      
    // };

    // socket.onclose = (what) => {
    //   console.log(`WebSocket connection closed`);
    //   console.log(what)
    // };
    
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
        crossOrigin='anonymous'
      >
      <track
      label="English"
      kind="subtitles"
      srcLang='en'
      src="http://localhost:8000/media/subtitles/69420EN.vtt"
      />

      <track
      label="Malay"
      kind="subtitles"
      srcLang='az'
      src="http://localhost:8000/media/subtitles/69420EN.vtt"
      />

      </video>
    </div>
  );
};
