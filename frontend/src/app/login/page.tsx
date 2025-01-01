"use client"

import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import React from "react"

function OAuthButton({ provider, icon_src }: { provider: string, icon_src: string }) {

  return (
    <button
      className="flex flex-row bg-white rounded-lg h-8 px-4 space-x-3 items-center hover:scale-105 hover:drop-shadow-sm transition-all"
      onClick={() => {redirect(`http://localhost:8000/oauth/${provider}`)}}>
      <Image className="w-5 h-auto" src={icon_src} alt={provider} width={20} height={64}/>
      <div className="text-black text-xs">Continue with {provider.charAt(0).toUpperCase() + provider.slice(1)}</div>
    </button>
  )
}

function SignInCard() {
  
  return (
    <div className="flex flex-col w-3/4 lg:w-1/3 h-[29rem] bg-gradient-to-br from-purple-200 to-[#9EFCFF]
    rounded-lg drop-shadow-lg px-12 lg:px-20 pb-12 pt-8 space-y-4">
      <div className="text-black text-2xl font-semibold">Sign In</div>
      <input className="h-8 bg-white rounded-lg p-2 text-black text-xs" placeholder="Username"/>
      <input className="h-8 bg-white rounded-lg p-2 text-black text-xs" placeholder="Password"/>
      <button className="h-8 bg-purple-400 rounded-lg p-1 font-bold font-white text-sm hover:scale-105 hover:drop-shadow-sm transition-all">Sign In</button>
      <div className="flex flex-row space-x-2 justify-center items-center">
         <hr className="w-1/2 border-black"/>
         <div className="text-black text-sm font-semibold">or</div>
         <hr className="w-1/2 border-black"/>
      </div>
      <OAuthButton provider="42" icon_src="/42.svg" />
      <OAuthButton provider="discord" icon_src="/discord.svg" />
      <OAuthButton provider="github" icon_src="/github.svg" />
      <div className="flex flex-row text-black text-[0.6rem] space-x-2 items-center justify-center">
        <Link href="/register" className="text-blue-500 underline cursor-pointer">Register</Link>
        <div>or</div>
        <Link href="/login" className="text-blue-500 underline cursor-pointer">Reset Password</Link>
      </div>
    </div>
  )
}

export default function Login() {

  return (
    <div className="flex flex-col h-screen w-screen bg-white items-center justify-center space-y-4">
      <div className="font-bold text-black">hypertube</div>
      <SignInCard />
    </div>
  )
}