"use client"

import Footer from "@/components/Footer"
import Header from "@/components/Header"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"

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
        })
      } else {
        setUserNotFound(true)
      }
    }).catch((error) => console.log(error))
  }, [id])

  // TODO: Finish watched videos

  return (
    <div className="h-screen w-full bg-white flex flex-col justify-between">
      <Header />
      {
        !userNotFound && 
        <div className="h-auto flex flex-col justify-center py-10 px-8 lg:px-16 mb-auto space-y-4">
          <div className="flex flex-row space-x-8">
            <Image src={`http://localhost:8000${profilePicURL}`} alt="profile picture" width={150} height={150}
            className="rounded-full w-32 h-32"/>
            <div className="flex flex-col space-y-3 justify-center">
              <div className="text-black text-4xl font-bold">{'@' + username}</div>
              <div className="text-black text-xl ">{firstName + ' ' + lastName}</div>
            </div>
          </div>
          <div className="text-black">
            {'Watched videos:' + JSON.stringify(watched)}
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