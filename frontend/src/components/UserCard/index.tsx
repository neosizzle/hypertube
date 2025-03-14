"use client"

import { useRouter } from "next/navigation"
import Image from "next/image";


export default function UserCard({ username, userID, profilePicURL }: {username: string, userID: number, profilePicURL: string}) {
  
  const router = useRouter();
  
  return (
    <div className="h-32 w-72 text-black rounded-lg bg-white cursor-pointer shadow-md hover:scale-110 hover:shadow-purple-300 hover:shadow-xl transition-all"
    onClick={() => router.push(`/users/${userID}`)}>
      <div className="flex flex-row justify-start items-center p-3 space-x-5">
        <Image src={profilePicURL} alt={username} width={500} height={500} className="rounded-full size-24"/>
        <div className="text-black">
          <div className="font-bold text-xl whitespace-normal">{username}</div>
          <div className="text-md">{userID}</div>
        </div>
      </div>
    </div>
  )
}