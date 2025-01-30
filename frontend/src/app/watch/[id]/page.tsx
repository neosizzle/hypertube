'use client'

import Footer from "@/components/Footer"
import Header from "@/components/Header"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import Image from "next/image"

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

function VideoInfo({ id }: { id: string }) {

  const [title, setTitle] = useState('Squid Game')

  return (
    <div className="px-4 lg:space-y-4 flex flex-col items-start">
      <div className="text-black font-bold text-2xl lg:text-5xl">{title}</div>
      <div className="text-black font-medium text-md lg:text-2xl">S1E6</div>
      <div className="text-black font-medium text-xs lg:text-xl pt-1 lg:pt-0">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</div>
    </div>
  )
}

function TorrentInfo() {

  return (
    <div className="flex flex-col w-1/3 h-[44rem] bg-gray-100 rounded-lg p-5">
      <div className="text-black text-bold text-4xl p-4">Torrent Info</div>
    </div>
  )
}

export default function Watch() {

  const { id } : { id : string } = useParams()
  const [ showId ] = useState(id)

  useEffect(() => {

    fetch(`http://localhost:8000/api/videos/stream?id=${id}`).then(

    ).catch((error) => console.error(error))
    

  }, [id])

  return (
    <div className="h-auto w-full bg-white flex flex-col justify-between">
      <Header />
      <div className="flex flex-col justify-center lg:py-10 lg:px-16 mb-auto space-y-4 lg:space-y-8">
        <div className="flex flex-col lg:flex-row space-x-8 h-full">
          <iframe className="w-full lg:w-[65%] aspect-video bg-black text-black lg:rounded-xl" src="https://www.youtube.com/embed/dQw4w9WgXcQ"/>
          {/* <TorrentInfo /> */}
        </div>
        <VideoInfo id={id}/>
        <CommentSection videoID={id}/>
      </div>
      <Footer />
    </div>
  )
}