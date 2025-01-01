"use client"

import Link from "next/link"

function RegisterCard() {

  return (
    <div className="flex flex-col w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/4 h-[29rem] lg:h-[40rem] bg-gradient-to-br from-purple-200 to-[#9EFCFF]
    rounded-lg drop-shadow-lg px-12 lg:px-20 pb-12 pt-8 lg:pt-16 space-y-4">
      <div className="text-black text-2xl lg:text-4xl font-semibold lg:pb-3">Register</div>
      <input className="h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base" placeholder="Username"/>
      <input className="h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base" placeholder="Password"/>
      <input className="h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base" placeholder="Email"/>
      <input className="h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base" placeholder="Full Name"/>
      <button className="h-8 lg:h-12 bg-purple-400 rounded-lg p-1 font-bold font-white text-sm lg:text-base
      hover:scale-105 hover:drop-shadow-sm transition-all">Register</button>
      <div className="flex flex-row text-black text-[0.6rem] lg:text-xs space-x-2 items-center justify-center">
        <Link href="/login" className="text-blue-500 underline cursor-pointer">Log In</Link>
        <div>or</div>
        <Link href="/reset" className="text-blue-500 underline cursor-pointer">Reset Password</Link>
      </div>
    </div> 
  )
}

export default function Register() {
  return (
    <div className="flex flex-col h-screen w-screen bg-white items-center justify-center space-y-4">
      <div className="font-bold text-black text-base lg:text-2xl">hypertube</div>
      <RegisterCard key="register-card"/>
    </div>
  )
}