"use client"

import Footer from "@/components/footer";
import Header from "@/components/header";
import { motion } from "motion/react";
import Image from "next/image"
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function Account() {

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [isEdit, setEdit] = useState(false)
  const router = useRouter()

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

  return (
    <div className="h-screen w-screen bg-white flex flex-col justify-between">
      <Header />
      <div className="flex flex-col justify-center py-10 px-16 grow mb-auto border-2 space-y-4">
        <div className="text-black text-4xl bg-clip-text font-bold">Account</div>
        <hr className="w-full h-1 bg-gradient-to-r from-purple-200 to-[#9EFCFF] bg-clip-border my-4 rounded-md" />
        <div className="flex flex-col space-y-4">
          <div className="text-black text-xl font-medium ">Profile Details</div>
          <div className="flex flex-row justify-start space-x-4">
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
                <input className="w-96 h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base border border-slate-400" defaultValue={username}/>
              </div>
              <div className="space-y-1">
                <div className="text-black font-bold">Last Name</div>
                <input className="w-96 h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base border border-slate-400" defaultValue={username}/>
              </div>
              <button className="w-48 h-8 lg:h-10 bg-purple-400 rounded-lg p-1 font-medium font-white text-sm lg:text-lg
              hover:scale-105 hover:drop-shadow-sm transition-all" onClick={() => {router.push('/reset')}}>Update Profile</button>
            </div>
            <div className="flex flex-col items-center relative space-x-5">
              <div className="text-black font-bold justify-start">Profile Picture</div>
              <Image src="/discord.svg" alt="profile picture" width={150} height={150} />
              <button className="w-16 h-8 lg:h-10 bg-purple-400 rounded-lg p-1 font-medium font-white text-sm lg:text-lg
              hover:scale-105 hover:drop-shadow-sm transition-all" onClick={() => setEdit(!isEdit)}>Edit</button>
              <motion.div
                initial={exit}
                animate={isEdit ? enter : exit}
                className="absolute top-56 bg-white rounded-lg text-black z-10">
                  <ul className="p-4 space-y-4 border-2 rounded-lg w-44">
                    <li className="hover:text-gray-500 cursor-pointer">Remove Picture</li>
                    <li className="hover:text-gray-500 cursor-pointer">Upload new...</li>
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