"use client"

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import UserCard from "@/components/UserCard";
import { useDebounce } from "@/hooks/useDebounce";
import { User } from "@/types/User";
import { useEffect, useState } from "react";

export default function Users() {

  const [query, setQuery] = useState("")
  const [debounceQuery, setDebounceQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])

  const debounce = useDebounce(query, 1000)

  useEffect(() => setDebounceQuery(query), [debounce]) // eslint-disable-line react-hooks/exhaustive-deps
  
  useEffect(() => {

    if (debounceQuery === '') {
      setUsers([])
      return
    }

    fetch(`http://localhost:8000/api/users/public?username=${query}`, {
      credentials: "include"
    }).then((data) => {
      if (data.ok) {
        data.json().then((json) => {
          setUsers(json)
          console.log(json)
        })
      }
    }).catch((e) => console.error(e))

  }, [debounceQuery])

  return (
    <div className="h-screen w-full bg-white flex flex-col justify-between">
      <Header />
      <div className="h-auto w-full flex flex-col justify-center py-10 px-10 lg:px-16 mb-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between md:pt-12 space-y-4 md:space-y-0 text-black">
          <div className="text-md md:text-lg lg:text-4xl font-medium">Find Users</div>
          <div className="flex w-80 h-10 rounded-md border-2 border-black p-2 space-x-2 justify-center items-center">
            <input placeholder={"Search by username"} className="w-full outline-none focus:outline-none focus:ring-0 border-none overflow-hidden bg-transparent"
            onChange={(e) => setQuery((e.target as HTMLInputElement).value)} value={query}/>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-y-8 gap-x-auto place-items-center">
          {
            users.map((u, i) => <UserCard key={i} username={u.username} userID={u.id} profilePicURL={"http://localhost:8000" + u.profile_picture}/>)
          }
        </div>
      </div>
      <Footer />
    </div>
  )
}