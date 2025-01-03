"use client"
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, makeUseVisualState } from "motion/react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation";
import { Router } from "next/router";

function Search() {

  const [isSearching, setIsSearching] = useState(false)
  const ref = useRef<HTMLImageElement>(null)
  
  useEffect(() => {

    const handleClickOutside = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setIsSearching(false);
      }
    }

    if (!isSearching) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
    
  }, [ref])

  const searchBarEnter = {
    opacity: 1,
    x: "0%",
    transition: {
      duration: 0.2
    },
    display: "flex"
  }

  const searchBarExit = {
    opacity: 0,
    x: "200%",
    transition: {
      duration: 0.2
    },
    transitionEnd: {
      display: "none"
    }
  }

  const searchIconEnter = {
    opacity: 0,
    transition: {
      duration: 0
    },
    transitionEnd: {
      display: "none"
    }
  }

  const searchIconExit = {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "anticipate"
    },
    transitionEnd: {
      display: "flex"
    }
  }

  return (
    <div className="flex flex-row w-64 h-10 justify-end items-center overflow-hidden" ref={ref}>
      <motion.div
      initial={searchIconExit}
      animate={isSearching ? searchIconEnter : searchIconExit}
      transition={{ duration: 0.2 }}>
        <Image src="/search.svg" alt="search" width={25} height={25} className="w-6 h-6" onClick={() => setIsSearching(true)}/>
      </motion.div>
      <motion.div
      initial={searchBarExit}
      animate={isSearching ? searchBarEnter : searchBarExit}
      transition={{ duration: 0.3, ease: "anticipate"}}
      className="flex w-64 h-10 rounded-md border-2 border-black p-2 space-x-2">
        <Image src="/search.svg" alt="search" width={25} height={25} className="w-6 h-6"/>
        <input placeholder="Search" className="outline-none focus:outline-none focus:ring-0 border-none overflow-hidden bg-transparent"></input>
      </motion.div>
    </div>
  )
}

function Profile() {

  const [isHover, setIsHover] = useState(false)
  const toggleHover = () => {setIsHover(!isHover)}
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
      delay: 0.5,
      duration: 0.2
    },
    transitionEnd: {
      display: "none"
    }
  }

  const handleLogOut = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }
  
  return (
    <div className="flex items-center">
      <motion.div
      onHoverStart={toggleHover}
      onHoverEnd={toggleHover}
      >
        <Image src="/discord.svg" alt="user" width={25} height={25}/>
        <motion.div
          initial={exit}
          animate={isHover ? enter : exit}
          className="absolute top-16 right-14 bg-white rounded-lg text-black z-10">
            <ul className="p-4 space-y-4 border-2 rounded-lg w-32">
              <li className="hover:text-gray-500"><Link href="/account">Account</Link></li>
              <li className="hover:text-gray-500"><button onClick={handleLogOut}>Log Out</button></li>
            </ul>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function Header() {
  return (
    <header className="flex flex-row top-0 sticky text-black justify-between items-center py-3 px-16 bg-gradient-to-r from-purple-200 to-[#9efcff] z-10">
      <div className="flex flex-row items-center justify-center space-x-4">
        <div className="bg-clip-text inline-block font-bold text-purple-400 text-base lg:text-2xl">hypertube</div>
        <Link className="font-bold" href={"/browse"}>Home</Link>
      </div>
      <div className="flex flex-row items-center justify-center space-x-4">
        <Search />
        <Profile />
      </div>
    </header>
  )
}
