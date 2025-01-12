"use client"

import { useEffect, useRef, useState, useContext } from "react";
import { motion } from "motion/react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation";
import { SearchContext } from "@/providers/SearchProvider";

function Search() {

  const router = useRouter()
  const pathname = usePathname()
  
  const { searchQuery, setSearchQuery, isOpen, setIsOpen } = useContext(SearchContext);
  
  const ref = useRef<HTMLImageElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputDivRef = useRef<HTMLDivElement>(null)
  
  const [isSearching, setIsSearching] = useState(false)

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

  // handle searchbar open and close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setIsOpen(false)
    }
    if (pathname.startsWith('/search')) return
    if (isOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => { document.removeEventListener("mousedown", handleClickOutside) }
  }, [ref])

  // preserve focus
  useEffect(() => { if (inputRef.current) inputRef.current.focus() }, [inputRef])

  useEffect(() => { setIsSearching(searchQuery !== '') }, [searchQuery])

  // redirect to /search if start searching
  useEffect(() => {
    (isSearching) ? router.push('/search') : router.push('/browse')
  }, [isSearching])

  return (
    <div className="flex flex-row w-68 h-10 justify-end items-center overflow-hidden" ref={ref}>
      <motion.div
      initial={ isOpen ? searchIconExit : searchIconEnter }
      animate={ isOpen ? searchIconEnter : searchIconExit }>
        <Image src="/search.svg" alt="search" width={25} height={25} className="w-6 h-6" onClick={() => setIsOpen(true)}/>
      </motion.div>
      <motion.div
      ref={inputDivRef}
      initial={ isOpen ? searchBarEnter : searchBarExit }
      animate={ isOpen ? searchBarEnter : searchBarExit }
      onAnimationComplete={() => {
        if (isOpen && inputRef.current) inputRef.current.focus()
        else if (!isOpen && inputDivRef.current) inputDivRef.current.style.display = 'none'
        }}
      className="flex w-full h-10 rounded-md border-2 border-black p-2 space-x-2 justify-center items-center">
        <Image priority src="/search.svg" alt="search" width={25} height={25} className="w-6 h-6"/>
        <input placeholder="Search" className="outline-none focus:outline-none focus:ring-0 border-none overflow-hidden bg-transparent"
        onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)} value={searchQuery} ref={inputRef}/>
        <Image priority src="/close.svg" alt="search" width={25} height={25} className="w-6 h-6" onClick={() => setSearchQuery('')}/>
      </motion.div>
    </div>
  )
}

function Profile({ isLoggedIn, profilePicURL } : { isLoggedIn : boolean, profilePicURL : string}) {

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
    fetch('http://localhost:8000/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    }).then((data) => {
      if (data.ok) router.push('/login');
    }).catch((error) => {
      console.error(error)
    })
  }

  return (
    <div className="flex items-center relative">
      <motion.div
      onHoverStart={toggleHover}
      onHoverEnd={toggleHover}
      >
        <Image src={profilePicURL} alt="user" width={25} height={25}
        className="rounded-full w-6 h-6"/>
        <motion.div
          initial={exit}
          animate={isHover ? enter : exit}
          className="absolute top-16 right-0 bg-white rounded-lg text-black z-10">
            {isLoggedIn ? <ul className="p-4 space-y-4 border-2 rounded-lg w-32">
              <li className="hover:text-gray-500"><Link href="/account">Account</Link></li>
              <li className="hover:text-gray-500"><button onClick={handleLogOut}>Log Out</button></li>
            </ul> : <ul className="p-4 space-y-4 border-2 rounded-lg w-32">
              <li className="hover:text-gray-500"><Link href="/login">Log In</Link></li>
            </ul>}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function Header() {

  const [profilePicURL, setProfilePicURL] = useState('http://localhost:8000/media/profile_pics/default.png')
  const [login, setLogin] = useState(true)

  useEffect(() => {
    fetch(`http://localhost:8000/api/users/me`, {
      method: 'GET',
      credentials: 'include',
    }).then((data) => {
      if (data.ok) {
        data.json().then((json) => { if (json.profile_picture) setProfilePicURL(`http://localhost:8000` + json.profile_picture) })
      } else setLogin(false)
    })
  }, [])

  return (
    
    <header className="flex flex-row top-0 text-black justify-between items-center py-3 px-16 bg-gradient-to-r from-purple-200 to-[#9efcff] z-10">
        <div className="flex flex-row items-center justify-center space-x-4">
          <div className="bg-clip-text inline-block font-bold text-purple-400 text-base lg:text-2xl">hypertube</div>
          <Link className="font-bold" href={"/browse"}>Home</Link>
        </div>
        <div className="flex flex-row items-center justify-center space-x-4">
            <Search />
          <Profile isLoggedIn={login} profilePicURL={profilePicURL} />
        </div>
    </header>
  )
}
