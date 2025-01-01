"use client"

import Link from "next/link"

function RegisterCard() {

  return (
    <div className="flex flex-col w-3/4 lg:w-1/3 h-[29rem] bg-gradient-to-br from-purple-200 to-[#9EFCFF]
      rounded-lg drop-shadow-lg px-12 lg:px-20 pb-12 pt-8 space-y-4">
      <div className="text-black text-2xl font-semibold">Register</div>
      <input className="h-8 bg-white rounded-lg p-2 text-black text-xs"placeholder="Username"/>
      <input className="h-8 bg-white rounded-lg p-2 text-black text-xs" placeholder="Password"/>
      <input className="h-8 bg-white rounded-lg p-2 text-black text-xs" placeholder="Email"/>
      <input className="h-8 bg-white rounded-lg p-2 text-black text-xs" placeholder="Full Name"/>
      <button className="h-8 bg-purple-400 rounded-lg p-1 font-bold font-white text-sm hover:scale-105 hover:drop-shadow-sm transition-all">Register</button>
      <div className="flex flex-row text-black text-[0.6rem] space-x-2 items-center justify-center">
        <Link href="/login" className="text-blue-500 underline cursor-pointer">Log In</Link>
        <div>or</div>
        <Link href="/login" className="text-blue-500 underline cursor-pointer">Reset Password</Link>
      </div>
    </div> 
  )
}

export default function Register() {
  return (
    <div className="flex flex-col h-screen w-screen bg-white items-center justify-center space-y-4">
      <div className="font-bold text-black">hypertube</div>
      <RegisterCard key="register-card"/>
    </div>
  )
}