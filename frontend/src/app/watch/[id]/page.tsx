'use client'

import Footer from "@/components/footer"
import Header from "@/components/header"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "motion/react"
import Image from "next/image"
import { profile } from "console"
import Link from "next/link"

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

function Video({ id } : { id: number}) {

  return (
    <Link href={`/watch/${id}`} className="w-full flex flex-row p-4 space-x-4 hover:bg-black/10 rounded-lg">
      <div className="w-[35%] aspect-video bg-black rounded-xl"></div>
      <div className="text-black flex-col space-y-1">
        <div className="font-bold text-2xl">Episode 2</div>
        <div className="font-medium">Lorem ipsum dolor sit amet</div>
      </div>
    </Link>
  )
}

function OtherVideosCard() {

  return (
    <div className="flex flex-col w-1/3 h-[44rem] bg-gray-100 rounded-lg p-5">
      <div className="flex flex-row justify-between items-center p-4">
        <div className="text-black text-bold text-4xl">Episodes</div>
        <select className="text-black w-auto px-2 selection:font-medium text-xl bg-transparent hover:bg-black/10 outline-none rounded-lg">
          <option>Season 1</option>
          <option>Season 2</option>
        </select>
      </div>
      <div className="overflow-y-auto">
        <Video id={1}/>
        <Video id={2}/>
        <Video id={3}/>
        <Video id={4}/>
        <Video id={5}/>
      </div>
    </div>
  )

}

function CommentInput({ profilePicURL, isLoggedIn }: { profilePicURL: string, isLoggedIn: boolean }) {

  const [commenting, setCommenting] = useState(false)

  const handleComment = () => {

  }

  return (
    <div className="flex flex-row space-x-4 p-4">
      <Image src={profilePicURL} alt="user" width={25} height={25} className="justify-start items-center self-start w-8 h-8 rounded-full"/>
      <div className="flex flex-col space-y-2 w-full">
        <input className="w-full h-8 text-black text-md bg-transparent outline-none" placeholder={isLoggedIn ? "Add a comment..." : "You need to be logged in to comment."}
        onFocus={() => isLoggedIn ? setCommenting(true) : ''} disabled={!isLoggedIn}/>
        <motion.div className="" initial={exit} animate={commenting ? enter : exit} >
          <hr className="w-full h-1 bg-gradient-to-r from-purple-200 to-[#9EFCFF] bg-clip-border mb-2 rounded-md" />
          <div className="flex flex-row justify-start items-center">
            <button className="h-8 bg-purple-400 rounded-lg px-4 text-white text-sm
            hover:scale-105 hover:drop-shadow-sm transition-all justify-center items-center" onClick={handleComment}
            >Comment</button>
            <button className="h-8 bg-transparent px-4 text-black text-sm
            hover:text-gray-500" onClick={() => setCommenting(false)}
            >Cancel</button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function Comment({ username, content }: { username: string, content: string }) {

  return (
    <div className="flex flex-row space-x-4 p-4">
      <Image src="/discord.svg" alt="user" width={25} height={25} className="justify-start items-center self-start w-8 h-8"/>
      <div className="flex flex-col space-y-1">
        <div className="text-black text-md font-bold">{'@' + username}</div>
        <div className="text-black text-md">{content}</div>
      </div>
    </div>
  )

}

function CommentSection() {

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [profilePicURL, setProfilePicURL] = useState('http://localhost:8000/media/profile_pics/default.png')

  useEffect(() => {
    fetch(`http://localhost:8000/api/users/me`, {
      method: 'GET',
      credentials: 'include',
    }).then((data) => {
      if (data.ok) {
        data.json().then((json) => {
          setIsLoggedIn(true)
          setProfilePicURL(`http://localhost:8000` + json.profile_picture)
        })
      }
    })
  }, [])

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-lg p-5">
      <div className="text-black text-bold text-4xl p-4">Comments</div>
      <CommentInput profilePicURL={profilePicURL} isLoggedIn={isLoggedIn}/>
      <Comment username="skibidfan69" content="i fucking hate this show!!!"/>
      <Comment username="skibidfan69" content="i fucking hate this show!!!"/>
      <Comment username="skibidfan69" content="i fucking hate this show!!!"/>
      <Comment username="skibidfan69" content="i fucking hate this show!!!"/>
  </div>
  )

}

function VideoInfo({ id }: { id: string }) {

  const [title, setTitle] = useState('Squid Game')

  return (
    <div className="space-y-4 flex flex-col items-start">
      <div className="text-black font-bold text-5xl">{title}</div>
      <div className="text-black font-medium text-2xl">S1E6</div>
      <div className="text-black font-medium text-xl">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</div>
    </div>
  )
}

function ShowInfo({ id }: {id : string}) {

  const [title, setTitle] = useState('Squid Game')

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-lg p-9 text-black space-y-4">
      <div className="space-y-1">
        <div className="text-2xl font-semibold">Show Summary</div>
        <div className="text-lg">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</div>
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-semibold">Ratings</div>
        <div className="text-lg"></div>
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-semibold">Cast</div>
        <div className="text-lg"></div>
      </div>
    </div>
  )

}

function TorrentInfo() {

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-lg p-5">
      <div className="text-black text-bold text-4xl p-4">Torrent Info</div>
    </div>
  )
}


export default function Watch() {

  const { id } : { id : string } = useParams()
  const [showId, setShowId] = useState(id)

  return (
    <div className="h-auto w-screen bg-white flex flex-col justify-between">
      <Header />
      <div className="flex flex-col justify-center py-10 px-16 mb-auto space-y-8">
        <div className="flex flex-row space-x-8 h-full">
          <iframe className="w-[65%] aspect-video bg-black text-black rounded-xl" src="https://www.youtube.com/embed/dQw4w9WgXcQ"/>
          <OtherVideosCard />
        </div>
        <div className="flex flex-row space-x-8 w-full">
          <div className="flex flex-col space-y-8 w-[65%]">
            <VideoInfo id={id}/>
            <CommentSection />
          </div>
          <div className="flex flex-col space-y-8 w-1/3">
            <ShowInfo id={showId} />
            <TorrentInfo />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}