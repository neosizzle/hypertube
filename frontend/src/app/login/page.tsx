"use client"

import { redirect } from "next/navigation"

function DiscordOAuth() {

  const login = () => {
    redirect('http://localhost:8000/oauth/discord')
  }

  return (<div className="cursor-pointer select-none" onClick={login}>Login with Discord</div>)
}

function Intra42OAuth() {

  const login = () => {
    redirect('http://localhost:8000/oauth/42')
  }

  return (<div className="cursor-pointer select-none" onClick={login}>Login with 42 Intra</div>)
}

function GitHubOAuth() {

  const login = () => {
    redirect('http://localhost:8000/oauth/github')
  }

  return (<div className="cursor-pointer select-none" onClick={login}>Login with GitHub</div>)
}


export default function Login() {

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-white text-black">
      <div className="font-bold">This is the login page</div>
      <DiscordOAuth />
      <Intra42OAuth />
      <GitHubOAuth />
    </div>
  )
}