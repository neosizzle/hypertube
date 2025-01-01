"use client"

import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import React from "react"


function ResetPasswordCard() {
  
  return (
    <div className="flex flex-col w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/4 h-[29rem] lg:h-[40rem] bg-gradient-to-br from-purple-200 to-[#9EFCFF]
    rounded-lg drop-shadow-lg px-12 lg:px-20 pb-12 pt-8 lg:pt-16 space-y-4">
      <div className="text-black text-2xl lg:text-4xl font-semibold">Reset Password</div>
      <div className="text-black text-sm lg:text-base font-normal">Enter the email address associated with your account. A 6 digit code will be sent.</div>
      <input className="h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base" placeholder="Email"/>
      <div className="flex flex-row justify-between space-x-2">
      <input className="h-8 lg:h-12 w-full xl:w-2/3 bg-white rounded-lg p-2 text-black text-xs lg:text-base" placeholder="6-digit code"/>
        <button className="h-8 lg:h-12 w-32 bg-purple-400 rounded-lg p-2 font-semibold font-white text-[0.6rem] md:text-xs lg:text-sm xl:text-base
        hover:scale-105 hover:drop-shadow-sm transition-all">Send Code</button>
      </div>
      <button className="h-8 lg:h-12 bg-purple-400 rounded-lg p-1 font-bold font-white text-sm lg:text-lg
      hover:scale-105 hover:drop-shadow-sm transition-all">Reset Password</button>
      <div className="flex flex-row text-black text-[0.6rem] lg:text-xs space-x-2 items-center justify-center">
        <Link href="/login" className="text-blue-500 underline cursor-pointer">Log In</Link>
        <div>or</div>
        <Link href="/register" className="text-blue-500 underline cursor-pointer">Register</Link>
      </div>
    </div>
  )
}

export default function Reset() {

  return (
    <div className="flex flex-col h-screen w-screen bg-white items-center justify-center space-y-4">
      <div className="font-bold text-black text-base lg:text-2xl">hypertube</div>
      <ResetPasswordCard />
    </div>
  )
}