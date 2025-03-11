'use client'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Peer from 'simple-peer';
import Footer from "@/components/Footer"
import Header from "@/components/Header"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { motion } from "motion/react"
import Image from "next/image"
import { User } from "../../../types/User"
import { useTranslations } from "next-intl"
import { locales } from "@/i18n/config"
import { Video } from "../../../types/Video"
import Spinner from "../../../components/Spinner"

const enter = {
  opacity: 1,
  y: "0%",
  transition: {
    duration: 0.2
  },
  display: "block"
}

const exit = {
  opacity: 0,
  y: "-100%",
  transition: {
    duration: 0.2
  },
  transitionEnd: {
    display: "none"
  }
}

function CommentInput({ videoID, profilePicURL, isLoggedIn, onSuccess }: { videoID: string, profilePicURL: string, isLoggedIn: boolean, onSuccess: () => void }) {

  const [commenting, setCommenting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [success, setSuccess] = useState(false)

  const handleComment = () => {

    fetch(`http://localhost:8000/api/videos/comments/${videoID}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: inputRef.current?.value
      })
    }).then((resp) => {
      if (resp.ok) setSuccess(true)
    }).catch((error) => console.error(error))
  }

  useEffect(() => {

    if (success === true) {
      onSuccess() // refresh comments
      setSuccess(false)
    }

  }, [success, onSuccess])

  return (
    <div className="flex flex-row space-x-4 px-4">
      <Image src={profilePicURL} alt="user" width={1000} height={1000} className="justify-start items-center self-start w-5 h-5 lg:w-8 lg:h-8 rounded-full"/>
      <div className="flex flex-col space-y-2 w-full">
        <input ref={inputRef} className="w-full h-8 text-black text-xs sm:text-sm md:text-md lg:text-lg bg-transparent outline-none"
        placeholder={isLoggedIn ? "Add a comment..." : "You need to be logged in to comment."}
        onFocus={() => isLoggedIn ? setCommenting(true) : ''} disabled={!isLoggedIn}/>
        <motion.div className="" initial={exit} animate={commenting ? enter : exit} >
          <hr className="w-full h-1 bg-gradient-to-r from-purple-200 to-[#9EFCFF] bg-clip-border mb-2 rounded-md" />
          <div className="flex flex-row justify-start items-center">
            <button className="h-8 bg-purple-400 rounded-lg px-4 text-white text-xs sm:text-sm md:text-md lg:text-lg
            hover:scale-105 hover:drop-shadow-sm transition-all justify-center items-center" onClick={handleComment}
            >Comment</button>
            <button className="h-8 bg-transparent px-4 text-black text-xs sm:text-sm md:text-md lg:text-lg
            hover:text-gray-500" onClick={() => setCommenting(false)}
            >Cancel</button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

type Comment = {
  user: {
    username: string
    id: string
    profile_picture: string
  }
  content: string
  created: string
}

function Comment({ comment }: { comment: Comment }) {

  const router = useRouter()

  const handleClick = () => {
    router.push(`/users/${comment.user.id}`)
  }

  useEffect(() => {
    console.log(JSON.stringify(comment))
  }, [comment])

  return (
    <div className="flex flex-row space-x-2 lg:space-x-4 px-4">
      <Image src={'http://localhost:8000' + comment.user.profile_picture} alt="user" width={1000} height={1000}
      className="justify-start items-center self-start w-5 h-5 lg:w-8 lg:h-8 cursor-pointer rounded-full border-[1.5px] border-black"
      onClick={handleClick}/>
      <div className="flex flex-col space-y-1">
        <div className="text-black text-xs sm:text-sm md:text-md lg:text-lg font-bold cursor-pointer"
        onClick={handleClick}>{'@' + comment.user.username}</div>
        <div className="text-black text-xs sm:text-sm md:text-md lg:text-lg">{comment.content}</div>
      </div>
    </div>
  )
}

function CommentSection({ videoID }: {videoID : string}) {

  const [userID, setUserID] = useState('')
  const [profilePicURL, setProfilePicURL] = useState('http://localhost:8000/media/profile_pics/default.png')
  const [comments, setComments] = useState([])

  const getComments = () => {

    fetch(`http://localhost:8000/api/videos/comments/${videoID}`, {
      method: 'GET',
    }).then((resp) => {
      if (resp.ok) resp.json().then((data) => setComments(data))
    }).catch((error) => console.error(error))

  }

  useEffect(() => {
    fetch(`http://localhost:8000/api/users/me`, {
      method: 'GET',
      credentials: 'include',
    }).then((data) => {
      if (data.ok) {
        data.json().then((json) => {
          setUserID(json.id)
          setProfilePicURL(`http://localhost:8000` + json.profile_picture)
          getComments()
        })
      }
    })
  }, [])

  return (
    <div className="flex flex-col h-full bg-gray-100 lg:rounded-lg py-4 lg:p-5 space-y-4 lg:space-y-8">
      <div className="text-black text-bold text-xl lg:text-4xl px-4">Comments</div>
      <CommentInput profilePicURL={profilePicURL} isLoggedIn={userID !== ''} videoID={videoID} onSuccess={getComments}/>
      {
        comments.map((c, i) => <Comment key={i} comment={c}/>)
      }
  </div>
  )

}

function VideoInfo({ tmbd_id, onObtainImdbId, onObtainName }: { tmbd_id: string, onObtainImdbId : (v: string) => void, onObtainName : (v: string) => void}) {

  const [title, setTitle] = useState('')
  const [releaseDate, setReleaseDate] = useState('');
  const [overview, setOverview] = useState('');

  const { push } = useRouter()

  useEffect(() => {
    if (tmbd_id == '') {
      return
    }

    fetch(`http://localhost:8000/api/show/info?id=${tmbd_id}&type=movie`)
    .then((resp) => {
      if (resp.ok) {
        resp.json().then((data) => {
          setTitle(data.title)
          setReleaseDate(data.details.release_date)
          setOverview(data.overview)
          onObtainImdbId(data.details.imdb_id)
          onObtainName(data.title)
        })
      }
    })
    .catch((e) => {
      console.log(e)
      alert("show info fetch error")
      push("/browse")
    })
  }, [tmbd_id, push])
  

  return (
    <div className="px-4 lg:space-y-4 flex flex-col items-start">
      {
        title.length == 0 ?
        <div className="animate-pulse h-10 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
        :
        <div className="text-black font-bold text-2xl lg:text-5xl">{title}</div>
      }

      {
        releaseDate.length == 0 ?
        <div className="animate-pulse h-5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
        :
        <div className="text-black font-medium text-md lg:text-2xl">{releaseDate}</div>
      }

      {
        overview.length == 0 ?
        <div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 w-full mb-4"></div>
        :
        <div className="text-black font-medium text-xs lg:text-xl pt-1 lg:pt-0">{overview}</div>
      }

    </div>
  )
}

function StatusDisplay({ video, subPath, resolvingMagnet, torrent_file_name, stream }: { video: Video | null, subPath : string | null, resolvingMagnet : boolean, torrent_file_name: string | null, stream: MediaStream | null}) {
  
  return (
    <div className="text-black space-y-2">
      <div className="text-black font-medium text-md lg:text-2xl">Torrent Status</div>
      <div className="flex flex-row justify-between">
        <div>Video:</div>
        <div>{video ? '✅' : <Spinner/>}</div>
      </div>
  
      <div className="flex flex-row justify-between">
        <div>Subtitles:</div>
        <div>{subPath ? '✅' : <Spinner/>}</div>
      </div>
      
      <div className="flex flex-row justify-between">
        <div>Torrent:</div>
        <div>{!resolvingMagnet || torrent_file_name ? '✅' : <Spinner/>}</div>
      </div>
      
      <div className="flex flex-row justify-between">
        <div>Stream:</div>
        <div>{stream ? '✅' :  <Spinner/>}</div>
      </div>
    </div>
  )
}

function SubtitleLocaleSelector({ curr_lang, curr_lang_available, className, onChange }: { curr_lang: string, curr_lang_available: boolean, className?: string, onChange: (value: string) => void }) {

  const l = useTranslations('Locales')

  return (
   <div className="text-black font-medium text-md lg:text-2xl space-y-2">
     <div>Subtitles</div>
     <div className="flex flex-row justify-between space-x-5 font-medium text-md lg:text-2xl">
      <select className={className}
        value={curr_lang}
        onChange={(e) =>  onChange(e.target.value)}>
          {
            locales.map((locale, i) =>  (<option key={i} value={locale}>{l(locale)}</option>))
          }
        </select>
        <div className="flex items-center justify-center">{curr_lang_available ? '✅' : '❌'}</div>
     </div>
   </div>
  )
}

export default function Watch() {
  const connectionRef = useRef(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const connectedStateRef = useRef(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { id } : { id : string } = useParams()
  const [user, setUser] = useState<User | null>(null);
  const [tmdbid, setTmdbid] = useState('');
  const [imdbid, setImdbid] = useState('');
  const [videoName, setVideoName] = useState('');
  const [video, setVideo] = useState<Video | null>(null);
  const [subLang, setSubLang] = useState<string | null>(null)
  const [subPath, setSubPath] = useState<string | null>(null)
  const [magnet, setMagnet] = useState<string | null>(null)
  const { sendMessage, lastMessage, readyState } = useWebSocket('ws://localhost:8000/ws/signalling/') // disconnects on unmounts automatically
  const [downloadingSub, setDownloadingSub] = useState(false)
  const [resolvingMagnet, setResolvingMagnet] = useState(false)
  const [initHandshakeData, setInitHandshakeData] = useState<string | null>(null);
  const { push } = useRouter()

  const [subAvailableMap, setSubAvailableMap] = useState(new Map<string, boolean>());
  
  const updateMap = (k: string, v: boolean) => {
    setSubAvailableMap(new Map(subAvailableMap.set(k,v)));
  }

  // mark all subs as unavailable initially
  useEffect(() => {
    locales.map((l) => {
      updateMap(l, false)
    })
  }, [])

  // init RTC peer when ws is connected
  useEffect(() => {
    if (readyState != ReadyState.OPEN)
      return
    
    // create rtc peer
    const peer = new Peer({ initiator: true, trickle: false });

    peer.on('signal', (data: object) => {
      // we are the initiator here, this would get called after creation OR ack video
      // for init, 'data' will contain an offer msg that needs to be sent to signalling server and hopefully receive the same signalling text
      // TODO: make these values correct

      const data_str = JSON.stringify(data)
      if (!connectedStateRef.current)
        setInitHandshakeData(data_str) // initial signal will be sent once magnet link / filename is retreived
      else // for ack video, 'data will contain ack message
        sendMessage(`pass|video|${data_str}|asd|asd|ada|asd||`)
    });

    peer.on('connect', () => {
      connectedStateRef.current = true
      // alert('remote peer connect')
    })

    peer.on('stream', (currentStream: MediaStream) => {
      setStream(currentStream)
    });

    peer.on('close', () => {
      // alert('remote peer close')
    })

    peer.on('error', (e: { message: string }) => {
      console.log(e.message)
      alert('remote peer error')
      push("/browse")
    })

    connectionRef.current = peer;
    
    return () => {
      peer.destroy()
      connectionRef.current = null;
    }

  }, [readyState])

  // handle get user
  useEffect(() => {
    // NOTE: always assuming this works as middleware does not fail us
    fetch(`http://localhost:8000/api/users/me`, {
      method: 'GET',
      credentials: 'include',
    }).then((data) => {
      if (data.ok) {
        data.json().then((json) => {
          setUser(json)
          setSubLang(json.lang)
        })
      }
    })
  }, [])

  // handle manual download of subtitle
  useEffect(() => {
    if (!subLang || !video || readyState != ReadyState.OPEN || !imdbid || downloadingSub) {
      return 
    }
    
    if ((subLang == "en" && video.en_sub_file_name == "") || (subLang == "ms" && video.bm_sub_file_name == "")){
      setDownloadingSub(true)
      fetch(`http://localhost:8000/api/videos/opensub_link?imdb_id=${imdbid}&lang=${subLang}`, { credentials:'include' })
      .then(data => {
        if (data.status != 200)
        {
          alert(`subtitle not found for ${subLang}`)
          setDownloadingSub(false)
          updateMap(subLang, false)
          return Promise.reject(`subtitle not found for ${subLang}`);
        }
        return data.json()
      })
      .then(data => {
        sendMessage(`pass|custom_sub|${data['data']}@${subLang}|${video.tmdb_id}|||||`)
      })
      .catch(err => console.log(err))
    }
    else {
      updateMap(subLang, true)
      if (subLang == "en") setSubPath(video.en_sub_file_name)
      else setSubPath(video.bm_sub_file_name)
    }
    
  }, [video, subLang, readyState, imdbid])
  
  // handle get magnet link if torrent file path is missing
  useEffect(() => {
    if (!video || !imdbid || resolvingMagnet || videoName == '') return

    if (video.torrent_file_name != '') {
      return
    }

    setResolvingMagnet(true)
    fetch(`http://localhost:8000/api/torrent/movie/search?name=${videoName}&site=yts&imdbid=${imdbid}`)
    .then(data => {
      if (data.status != 200)
      {
        alert(`torrent not found ${videoName}`)
        setResolvingMagnet(false)
        return Promise.reject(`torrent not found ${videoName}`);
      }
      return data.json()
    })
    .then(data => {
      const magnet = data['torrents'][0]['magnet']
      setMagnet(magnet)
      setResolvingMagnet(false)
    })
    .catch(err => {
      push("/browse")
      console.error(err)
    })

  }, [video, videoName, imdbid])
  
  // handle init RTC peer handshake, with either magnet link or torrent path
  useEffect(() => {
    if (!video || (magnet && video.torrent_file_name != '') || (!magnet && video.torrent_file_name == '') || !initHandshakeData || !user) return

    // if we have a magnet, send handshake with magnet link
    if (magnet)
      sendMessage(`pass|handshake|${initHandshakeData}|VNASA|${magnet}|subscne|mp4|${video.tmdb_id}|${user.prefered_stream_dimensions}`)
    else
      sendMessage(`pass|handshake|${initHandshakeData}|VASA|${video.torrent_file_name}|subscne|mp4|${video.tmdb_id}|${user.prefered_stream_dimensions}`)
  }, [video, magnet, initHandshakeData, user])

  // handle get streaming metadata
  useEffect(() => {

    if (user == null) {
      return
    }

    // GET api/videos to obtain torrent path and subtitle inforation
    fetch(`http://localhost:8000/api/videos/${id}`).then(data => data.json())
    .then(data => {
      setVideo(data)
      setTmdbid(data.tmdb_id)
    })
    .catch((error) => console.error(error))

    // mark video as watched
    fetch(`http://localhost:8000/api/videos/watched/${id}`, { method : 'POST', credentials: 'include' })
    .then(() => console.log("video marked as watched"))
    .catch((error) => console.error(error))
      
  }, [id, user])

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
      }
    };
  }, [stream]);

  // handle incoming ws messages
  useEffect(() => {
    if (lastMessage == null)
      return
    const tokens = lastMessage.data.split("|");
    const type = tokens[1]
    const message = tokens[2]
    console.log('Message from server:', type);

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
      const body = {torrent_file_name : message}
      fetch(`http://localhost:8000/api/videos/${id}`,{
        method: "PATCH",
        credentials: 'include',
        headers : {"Content-Type": "application/json"},
        body: JSON.stringify(body)
      })
      .then((data) => data.json())
      .then((body) => {
        setVideo(body)
      })
      .catch((e) => console.error(e))

    }
    if (type == "custom_sub") {
      // NOTE: video should not be null already here.
      const subLang = message
      const sub_path = `http://localhost:8000/media/subtitles/${video?.tmdb_id}${subLang}.webvtt`
      updateMap(subLang, true)
      setSubPath(sub_path)
      setDownloadingSub(false)

      // update model here
      const body = subLang == "en" ? { en_sub_file_name : sub_path } : { bm_sub_file_name: sub_path };
      fetch(`http://localhost:8000/api/videos/${id}`,{
        method: "PATCH",
        credentials: 'include',
        headers : {"Content-Type": "application/json"},
        body: JSON.stringify(body)
      })
      .then((data) => data.json())
      .then((body) => {
        setVideo(body)
        if (subLang == "en") setSubPath(body.en_sub_file_name)
        else setSubPath(body.bm_sub_file_name)
      })
      .catch((e) => console.error(e))
    }
  }, [lastMessage])
  
  return (
    <div className="h-auto w-full bg-white flex flex-col justify-between">
      <Header />
      <div className="flex flex-col justify-center lg:py-10 lg:px-16 mb-auto space-y-4 lg:space-y-8">
        <div className="flex flex-col lg:flex-row space-x-8 h-full justify-center">
          <video
          // autoPlay // This would cause connection failed by rtc peer if anabled somehow...
          controls={true}
          ref={videoRef}
          className="w-[100%] aspect-video bg-black text-black lg:rounded-xl"
          crossOrigin='anonymous'
          >
          {
            subLang == 'en' && subPath?
            <track
              label="English"
              kind="subtitles"
              srcLang='en'
              src={subPath}
              default={true}

            /> : <></>
          }
          {
            subLang == 'ms' && subPath?
            <track
              label="Malay"
              kind="subtitles"
              srcLang='ms'
              src={subPath}
              default={true}
            /> : <></>
          }
          </video>
        </div>
        <div className="flex flex-col md:flex-row justify-between">
          <VideoInfo tmbd_id={tmdbid} onObtainImdbId={setImdbid} onObtainName={setVideoName}/>
          {
            !subLang?
            <div className="animate-pulse h-10 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
            :
            <div className="flex flex-col px-4 lg:space-y-4">
              <SubtitleLocaleSelector
              className={`${downloadingSub? 'disabled' : ''} disabled w-72 lg:w-96 h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base
                border border-slate-400 items-center px-2 bg-transparent hover:bg-black/10 outline-none`}
              curr_lang={subLang}
              curr_lang_available={subAvailableMap.get(subLang) ?? false}
              onChange={(new_lang) => setSubLang(new_lang)}/>
              <StatusDisplay
              video={video}
              subPath={subPath}
              resolvingMagnet={resolvingMagnet}
              torrent_file_name={video?.torrent_file_name || null}
              stream={stream}/>
            </div>
          }
        </div>
        <CommentSection videoID={id}/>
      </div>
      <Footer />
    </div>
  )
}