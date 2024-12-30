"use client"

import { redirect } from "next/navigation"

function DiscordOAuth() {

  const login = () => {
    redirect('http://localhost:8000/auth/discord')
  }

  return (<div className="cursor-pointer select-none" onClick={login}>Login with Discord</div>)
}

export default function Login() {

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="font-bold">This is the login page</div>
      <DiscordOAuth />
    </div>
  )
}