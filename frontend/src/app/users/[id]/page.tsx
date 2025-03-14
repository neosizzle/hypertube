"use client"

import Footer from "@/components/Footer"
import Header from "@/components/Header"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import { FullInfo } from "@/types/ShowInfo"

function WatchedVideoTile({tmdbID, type}: {tmdbID: string, type: string}) {
  
  const [data, setData] = useState<FullInfo>()

  useEffect(() => {

    fetch(`http://localhost:8000/api/show/info?id=${tmdbID}&type=${type}`, {
    }).then((data) => {
      if (data.ok) {
        data.json().then((json) => setData(json))
      }
    })
  }, [])

  
  return (
    <div className="flex w-full h-24 rounded-lg shadow-lg justify-between hover:scale-105 transition-all">
      <div className="flex text-xl font-bold items-center p-5">
        {data && data.title}
      </div>
      {data && <Image src={data.backdrop_path} alt={data.title} width={1920} height={1080} className="w-[50%] z-0 object-cover rounded-tr-lg rounded-br-lg"/>}
    </div>
  )
}

export default function Users() {

  const { id } = useParams()
  const [username, setUsername] = useState('')
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [profilePicURL, setProfilePicURL] = useState('')
  const [watched, setWatched] = useState([])
  const [userNotFound, setUserNotFound] = useState(false)

  useEffect(() => {

    fetch(`http://localhost:8000/api/users/public/${id}`, {
      method: 'GET',
      credentials: 'include'
    }).then((response) => {
      if (response.ok) {
        response.json().then((json) => {
          setUsername(json.username)
          setFirstName(json.first_name)
          setLastName(json.last_name)
          setProfilePicURL(json.profile_picture)
          setWatched(json.watched_videos)
          console.log(watched)
        })
      } else {
        setUserNotFound(true)
      }
    }).catch((error) => console.log(error))
  }, [id])

  return (
    <div className="h-auto w-full bg-white flex flex-col justify-between">
      <Header />
      {
        !userNotFound && 
        <div className="h-auto flex flex-col justify-center py-10 px-8 lg:px-16 mb-auto space-y-8">
          <div className="flex flex-row space-x-8">
            <Image src={`http://localhost:8000${profilePicURL}`} alt="profile picture" width={150} height={150}
            className="rounded-full w-32 h-32"/>
            <div className="flex flex-col space-y-3 justify-center">
              <div className="text-black text-4xl font-bold">{'@' + username}</div>
              <div className="text-black text-xl ">{firstName + ' ' + lastName}</div>
              <div className="text-black text-xl">{watched.length} shows watched</div>
            </div>
          </div>
          <div className="text-black space-y-4">
            <div className="text-black font-bold text-2xl">Recently Watched</div>
            <div className="flex flex-col w-full h-auto space-y-4">
              {
                watched.map((w, i) => <WatchedVideoTile key={i} tmdbID={w.tmdb_id} type={w.type}/>)
              }
            </div>
          </div>
        </div>
      }
      {
        userNotFound &&
        <div className="h-auto flex flex-col justify-center py-10 px-8 lg:px-16 mb-auto space-y-4 text-black text-4xl">
          User with ID {id} not found.
        </div>
      }
      <Footer />
    </div>
  )
}