import { motion, AnimatePresence } from "motion/react"
import { useState, useEffect } from "react"
import Image from "next/image"

export type SeriesData = {
  no_seasons: number
  info: Array<{
    season_no: number
    no_episodes: number
    year: number
  }>
}

export type OtherData = {
  year: number
}

export type MovieData = {
  duration: number // minutes
  year: number
}

type ShowType = "series" | "movie" | "other"

export type ShowInfo = {
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
          className="absolute w-full top-38 h-10 -z-10 bg-gradient-to-r from-purple-200 to-[#9EFCFF] rounded-b-lg
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

export default function ShowCard({ info } : { info: ShowInfo }) {
  
  const [hover, setHover] = useState(false)

  return (
    <div className="w-24 md:w-80 aspect-video relative">
      <motion.div
      initial={{zIndex: "0"}}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        translateX: '-50%',
        translateY: '-50%',
        width: '100%'
      }}
      whileHover={{scale : 1.3, zIndex: "1", transition: {duration: 0.5, ease: "backOut"}}}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      className="relative group z-0">
        <div className="bg-black aspect-video w-full rounded-lg group-hover:rounded-b-none relative">
          <Image src={info.cover} alt={info.title} width={50} height={50}
          className="w-full h-full -z-10 object-cover rounded-lg opacity-80"/>
          <div className="absolute top-32 left-4 z-10 text-white font-bold text-xl">{info.title}</div>
          <div className="absolute top-0 w-full h-full z-0 bg-gradient-to-b from-transparent to-black/70 rounded-lg"></div>
        </div>
        {hover && <CardInfoExtension info={info} />}
      </motion.div>
    </div>
  )
}