"use client"

import { useRouter } from "next/navigation"

export default function ResetSuccess() {

  const router = useRouter()

  return (
    <div className="flex flex-col h-screen w-screen bg-white items-center justify-center space-y-4">
      <div className="font-bold text-black text-base lg:text-2xl">hypertube</div>
      <div className="flex flex-col w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/4 h-auto bg-gradient-to-br from-purple-200 to-[#9EFCFF]
      rounded-lg drop-shadow-lg px-12 lg:px-20 pb-12 pt-8 lg:pt-16 space-y-4">
        <div className="text-black text-2xl lg:text-4xl font-semibold">Reset Password Successful</div>
        <button className="h-8 lg:h-12 bg-purple-400 rounded-lg p-1 font-bold font-white text-sm lg:text-lg
        hover:scale-105 hover:drop-shadow-sm transition-all" onClick={() => {router.push('/login')}}>Login</button>
      </div>
    </div>
  )
}