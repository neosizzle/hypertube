'use client'

import Footer from "@/components/Footer"
import Header from "@/components/Header"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import Image from "next/image"
import Peer from 'simple-peer';
import { User } from "../../../types/User"
import { useLocale, useTranslations } from "next-intl"
import { locales } from "@/i18n/config"

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
          console.log(JSON.stringify(json))
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

function VideoInfo({ tmbd_id }: { tmbd_id: string }) {

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
          setTitle(data.original_title)
          setReleaseDate(data.details.release_date)
          setOverview(data.overview)
          console.log(data)
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

function SubtitleLocaleSelector({ curr_lang, className, onChange }: { curr_lang: string, className?: string, onChange: (value: string) => void }) {

  const l = useTranslations('Locales')

  return (
   <div>
     Subtitles: &nbsp;
     <select className={className}
      value={curr_lang}
      onChange={(e) =>  onChange(e.target.value)}>
        {
          locales.map((locale, i) =>  (<option key={i} value={locale}>{l(locale)}</option>))
        }
      </select>
      <div>subtitle downloading status...</div>
   </div>
  )
}

export default function Watch() {
  const connectionRef = useRef<any>(null);
  const wsRef = useRef<any>(null);
  const connectedStateRef = useRef(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { id } : { id : string } = useParams()
  const [ showId ] = useState(id)
  const [user, setUser] = useState<User | null>(null);
  const [tmdbid, setTmdbid] = useState('');
  const [subLang, setSubLang] = useState<string | null>(null)

  const init_ws = () => {
    // socket connect
    const socket = new WebSocket('ws://localhost:8000/ws/signalling/');

    socket.onopen = () => {
      
      // create rtc peer
      const peer = new Peer({ initiator: true, trickle: false });

      peer.on('signal', (data) => {
        // we are the initiator here, this would get called after creation OR ack video
        // for init, 'data' will contain an offer msg that needs to be sent to signalling server and hopefully receive the same signalling text
        // TODO: make these values correct
        const data_str = JSON.stringify(data)
        if (!connectedStateRef.current)
          socket.send(`pass|handshake|${data_str}|VNASA|videoanme|subscne|mp4|imdb_id|`)

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
  }

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
  

  useEffect(() => {

    if (user == null) {
      return
    }

    // get preferred language and resolution
    // console.log(user)

    // GET api/videos to obtain torrent path and subtitle inforation
    fetch(`http://localhost:8000/api/videos/${id}`).then(data => data.json())
    .then(data => {
      let need_update = false
      const tmdb_id = data.tmdb_id

      // set tmbd id state
      setTmdbid(tmdb_id)

      // torrent does not exist
      if (data.torrent_file_name.length == 0) {
        // TODO search for magnet link
        need_update = true
      }

      // TODO, get language from user, but assuming english for now
      if (data.en_sub_file_name.length == 0) {
        // get subtitle 
        need_update = true
      }

      // if need update, send put request to update model
      if (need_update) {
        fetch(`http://localhost:8000/api/videos/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            en_sub_file_name: `${tmdb_id}.vtt`,
            torrent_file_name: `${tmdb_id}.mp4`
          })
        })
      }

      // establish RTC handshake
      // init_ws()

    })
    .catch((error) => console.error(error))
  
    // mark current video as watched
  }, [id, user])

  return (
    <div className="h-auto w-full bg-white flex flex-col justify-between">
      <Header />
      <div className="flex flex-col justify-center lg:py-10 lg:px-16 mb-auto space-y-4 lg:space-y-8">
        <div className="flex flex-col lg:flex-row space-x-8 h-full">
          <iframe className="w-full lg:w-[65%] aspect-video bg-black text-black lg:rounded-xl" src="https://www.youtube.com/embed/dQw4w9WgXcQ"/>
          {
            !subLang?
            <div className="animate-pulse h-10 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
            :
            <SubtitleLocaleSelector
            className="w-72 lg:w-96 h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base
          border border-slate-400 items-center px-2 bg-transparent hover:bg-black/10 outline-none"
            curr_lang={subLang}
            onChange={(new_lang) => setSubLang(new_lang)}/>
          }
        </div>
        <VideoInfo tmbd_id={tmdbid}/>
        <CommentSection videoID={id}/>
      </div>
      <Footer />
    </div>
  )
}