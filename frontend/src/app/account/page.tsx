"use client"

import Footer from "@/components/footer";
import Header from "@/components/header";
import { motion } from "motion/react";
import { data } from "motion/react-client";
import Image from "next/image"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const enter = {
  opacity: 1,
  transition: {
    duration: 0.2
  },
  display: "block"
}

const exit = {
  opacity: 0,
  transition: {
    duration: 0.2
  },
  transitionEnd: {
    display: "none"
  }
}

export default function Account() {

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [isEdit, setEdit] = useState(false)
  const router = useRouter()

  const [profilePicURL, setProfilePicURL] = useState('')

  useEffect(() => {
    fetch(`http://localhost:8000/api/users/me`, {
      method: 'GET',
      credentials: 'include',
    }).then((data) => {
      if (data.ok) {
        data.json().then((json) => {
          setUsername(json.username)
          setEmail(json.email)
          setFirstName(json.first_name)
          setLastName(json.last_name)
          setProfilePicURL(json.profile_picture)
        })
      }
    })
  }, [])

  const uploadImage = () => {
    let fileUpload = document.createElement('input')
    fileUpload.type = 'file';

    fileUpload.onchange = (event) => {
    
      let target = event.target as HTMLInputElement;
      if (!target || !target.files)
        return

      let file = target.files[0]

      if (file.size >= 10 * 1024 * 1024)
      {
        alert('Image size must be less than 10mb')
        return
      }

      let formData = new FormData()
      formData.append('image', file)

      fetch('http://localhost:8000/api/users/picture', {
        method: 'POST',
        credentials: 'include',
        body: formData
      }).then((response) => {
        if (response.ok) response.json().then((data) => setProfilePicURL(data.detail))
      }).catch((error) => {
        console.error(error);
      })
    }

    fileUpload.click()
  }

  const deleteImage = () => {
    fetch('http://localhost:8000/api/users/picture', {
      method: 'DELETE',
      credentials: 'include',
    }).then((response) => {
      if (response.ok) response.json().then((data) => setProfilePicURL(data.detail))
    }).catch((error) => {
      console.error(error);
    })
  }

  return (
    <div className="h-screen w-screen bg-white flex flex-col justify-between">
      <Header />
      <div className="flex flex-col justify-center py-10 px-16 grow mb-auto border-2 space-y-4">
        <div className="text-black text-4xl bg-clip-text font-bold">Account</div>
        <hr className="w-full h-1 bg-gradient-to-r from-purple-200 to-[#9EFCFF] bg-clip-border my-4 rounded-md" />
        <div className="flex flex-col space-y-4">
          <div className="text-black text-xl font-medium ">Profile Details</div>
          <div className="flex flex-row justify-start space-x-8">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-1">
                <div className="text-black font-bold">Username</div>
                <input className="w-96 h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base border border-slate-400" defaultValue={username}/>
              </div>
              <div className="space-y-1">
                <div className="text-black font-bold">Email</div>
                <input className="w-96 h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base border border-slate-400" defaultValue={email}/>
              </div>
              <div className="space-y-1">
                <div className="text-black font-bold">First Name</div>
                <input className="w-96 h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base border border-slate-400" defaultValue={firstName}/>
              </div>
              <div className="space-y-1">
                <div className="text-black font-bold">Last Name</div>
                <input className="w-96 h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base border border-slate-400" defaultValue={lastName}/>
              </div>
              <button className="w-48 h-8 lg:h-10 bg-purple-400 rounded-lg p-1 font-medium font-white text-sm lg:text-lg
              hover:scale-105 hover:drop-shadow-sm transition-all" onClick={() => {router.push('/reset')}}>Update Profile</button>
            </div>
            <div className="flex flex-col items-center relative space-y-5">
              <div className="text-black font-bold justify-start">Profile Picture</div>
              <Image src={`http://localhost:8000${profilePicURL}`} alt="profile picture" width={150} height={150} 
              className="rounded-full w-32 h-32"/>
              <button className="w-16 h-8 lg:h-10 bg-purple-400 rounded-lg p-1 font-medium font-white text-sm lg:text-lg
              hover:scale-105 hover:drop-shadow-sm transition-all" onClick={() => setEdit(!isEdit)}>Edit</button>
              <motion.div
                initial={exit}
                animate={isEdit ? enter : exit}
                className="absolute top-56 bg-white rounded-lg text-black z-10">
                  <ul className="p-4 space-y-4 border-2 rounded-lg w-44">
                    <li className="hover:text-gray-500 cursor-pointer" onClick={deleteImage}>Remove Picture</li>
                    <li className="hover:text-gray-500 cursor-pointer" onClick={uploadImage}>Upload new...</li>
                  </ul>
              </motion.div>
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-4">
          <div className="text-black text-xl font-medium">Password and Authentication</div>
          <button className="w-48 h-8 lg:h-10 bg-purple-400 rounded-lg p-1 font-medium font-white text-sm lg:text-lg
                  hover:scale-105 hover:drop-shadow-sm transition-all" onClick={() => {router.push('/reset')}}>Reset Password</button>
        </div>
        <div className="flex flex-col space-y-4">
          <div className="text-black text-xl font-medium">Account Settings</div>
          <button className="w-48 h-8 lg:h-10 bg-purple-400 rounded-lg p-1 font-medium font-white text-sm lg:text-lg
                  hover:scale-105 hover:drop-shadow-sm transition-all" onClick={() => {router.push('/reset')}}>Delete Account</button>
        </div>
      </div>
      <Footer />
    </div>
  )
}