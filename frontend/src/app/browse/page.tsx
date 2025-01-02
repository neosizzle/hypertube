"use client"

import Image from "next/image";
import { redirect } from "next/navigation"
import { SyntheticEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react"
import { list } from "postcss";
import Link from "next/link";
import Head from "next/head";

type SeriesData = {
  no_seasons: number
  info: Array<{
    season_no: number
    no_episodes: number
    year: number
  }>
}

type OtherData = {
  year: number
}

type MovieData = {
  duration: number // minutes
  year: number
}

type ShowType = "series" | "movie" | "other"

type ShowInfo = {
  title: string,
  type: ShowType,
  imdb?: number,
  mal?: number,
  summary: string,
  genres: Array<string>, // or enum
  cover: string // url?
  produced_by: string
  cast: Array<[string, string]> // name, role
  data: SeriesData | MovieData | OtherData
}

function CardInfoExtension({ info } : { info: ShowInfo }) {

  const [imdb] = useState(info.imdb)
  const [mal] = useState(info.mal)

  const [displayData, setDisplayData] = useState("")

  useEffect(() => {

    if (info.type == "series") {
      const num = (info.data as SeriesData).no_seasons
      setDisplayData(num + " season" + (num > 1 ? "s" : ""))
    } else if (info.type == "movie") {
      const hours = Math.round((info.data as MovieData).duration / 60)
      const mins = (info.data as MovieData).duration - (hours * 60)
      setDisplayData((hours > 1 ? hours + " h" : "") + " " + mins + " m")
    } else {
      const year = (info.data as OtherData).year
      setDisplayData(year.toString())
    }

  }, [info])

  return (
    <AnimatePresence>
      <motion.div
          initial={{ opacity: 0, y: "-100%" }}
          animate={{ opacity: 1, y: "0%" }}
          exit={{ opacity: 0, y: "-100%" }}
          transition={{ duration: 0.3, ease: "anticipate"}}
          className="absolute w-full top-32 h-10 -z-10 bg-gradient-to-r from-purple-200 to-[#9EFCFF] rounded-b-lg
          px-3">
        <div className="flex flex-row w-full h-full items-center justify-between">
          <div className="flex flex-row space-x-2 justify-center items-center">
            <div className="font-medium text-xs text-black">{info.type.charAt(0).toUpperCase() + info.type.slice(1)}</div>
            <Image src={"/dot.svg"} alt="dot" width={3} height={3} />
            <div className="font-medium text-xs text-black">{displayData}</div>
          </div>
          <div className="flex flex-row space-x-1">
            {imdb &&
            <div className="flex flex-row space-x-1 justify-center items-center">
              <Image src={"/imdb.svg"} alt="imdb" width={25} height={25} />
              <div className="font-medium text-xs text-black">{imdb.toPrecision(2)}</div>
            </div>}
            {mal &&
            <div className="flex flex-row space-x-1 justify-center items-center">
              <Image src={"/mal.svg"} alt="mal" width={25} height={25} />
              <div className="font-medium text-xs text-black">{mal.toPrecision(2)}</div>
            </div>}
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function Card({ info } : { info: ShowInfo }) {
  
  const [hover, setHover] = useState(false)

  return (
    <div className="w-24 md:w-64 h-32 relative">
      <motion.div
      initial={{zIndex: "1"}}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        translateX: '-50%',
        translateY: '-50%',
        width: '100%'
      }}
      whileHover={{scale : 1.3, zIndex: "2", transition: {duration: 0.5, ease: "backOut"}}}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      className="relative group">
        <div className="bg-black h-32 rounded-lg group-hover:rounded-b-none relative">
          <Image src={info.cover} alt={info.title} width={50} height={50}
          className="w-full h-full object-cover rounded-lg opacity-80"/>
          <div className="absolute top-24 left-4 z-20 text-white font-bold">{info.title}</div>
          <div className="absolute top-0 w-full h-full z-10 bg-gradient-to-b from-transparent to-black/70 rounded-lg"></div>
        </div>
        {hover && <CardInfoExtension info={info} />}
      </motion.div>
    </div>
  )
}

let squid_game: ShowInfo = {
  title: "Squid Game",
  type: "series",
  data: {
    no_seasons: 2,
    info: [
      {
        season_no: 1,
        no_episodes: 9,
        year:2021
      },
      {
        season_no: 2,
        no_episodes: 7,
        year:2024
      },
    ]
  } as SeriesData,
  imdb: 8.0,
  mal: 4.5,
  summary: "Lorem ipsum dolor sit amet",
  genres: ["Action", "Drama", "Mystery"],
  produced_by: "bobo",
  cast: [],
  cover: "/discord.svg"
}

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

  return (
    <div className="flex flex-row w-64 h-10 justify-end items-center overflow-hidden" ref={ref}>
      {!isSearching && <AnimatePresence>
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}>
          <Image src="/search.svg" alt="search" width={25} height={25} className="w-6 h-6" onClick={() => setIsSearching(true)}/>
        </motion.div>
      </AnimatePresence>}
      {isSearching && <AnimatePresence>
        <motion.div
        initial={{ opacity: 0, x: "200%" }}
        animate={{ opacity: 1, x: "0%" }}
        exit={{ opacity: 0, x: "200%" }}
        transition={{ duration: 0.3, ease: "anticipate"}}
        className="flex flex-row w-64 h-10 rounded-md border-2 border-black p-2 space-x-2">
          <Image src="/search.svg" alt="search" width={25} height={25} className="w-6 h-6"/>
          <input placeholder="Search" className="outline-none focus:outline-none focus:ring-0 border-none overflow-hidden bg-transparent"></input>
        </motion.div>
      </AnimatePresence>}
    </div>
  )
}

function Profile() {
  return (
    <div>
      Profile!!
    </div>
  )
}

function Header() {
  return (
    <header className="flex flex-row top-0 sticky text-black justify-between items-center py-3 px-16 bg-gradient-to-r from-purple-200 to-[#9efcff]">
      <div className="flex flex-row items-center justify-center space-x-4">
        <div className="bg-clip-text inline-block font-bold text-purple-400 text-base lg:text-2xl">hypertube</div>
        <Link href={"/browse"}>Home</Link>
      </div>
      <div className="flex flex-row items-center justify-center space-x-4">
        <Search />
        <Profile />
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="flex flex-row inset-x-0 bottom-0 sticky text-black items-center py-3 px-16">
      Footer
    </footer>
  )
}

export default function Browse() {

  // useEffect(() => {

  //   // if user is not logged in, redirect to /login
  //   redirect('/login')
  // }, [])

  return (
    <div className="h-screen w-screen bg-white flex flex-col justify-between">
      <Header />
      <div className="flex flex-col justify-center py-10 px-16 mb-auto">
        <div className="space-y-3">
          <div className="font-bold text-2xl text-black">New on hypertube</div>
          <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            <Card info={squid_game} />
            <Card info={squid_game} />
            <Card info={squid_game} />
            <Card info={squid_game} />
            <Card info={squid_game} />
            <Card info={squid_game} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}