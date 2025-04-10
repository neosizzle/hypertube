import { motion } from "motion/react"
import { useState } from "react"
import Image from "next/image"
import { ShortInfo } from "../../types/ShowInfo"
import { useTranslations } from "next-intl"

function CardInfoExtension({ info } : { info: ShortInfo }) {

  const c = useTranslations('Common')

  return (
    <motion.div
        whileHover={{ opacity: 1, y: "0%" }}
        initial={{ opacity: 0, y: "-100%" }}
        animate={{ opacity: 1, y: "0%" }}
        transition={{ duration: 0.3, ease: "anticipate"}}
        className="absolute w-full top-38 h-10 -z-10 bg-gradient-to-r from-purple-200 to-[#9EFCFF] rounded-b-lg
        px-3">
      <div className="flex flex-row w-full h-full items-center justify-between">
        <div className="flex flex-row space-x-2 justify-center items-center">
          <div className="font-medium text-xs text-black">{c(info.type)}</div>
          <Image src={"/dot.svg"} alt="dot" width={3} height={3} />
          <div className="font-medium text-xs text-black">{new Date(info.date).getFullYear()}</div>
        </div>
      </div>
    </motion.div>
  )
}

export default function ShowCard({info, position, isWatched, onClick } : { info: ShortInfo, position?: 'left' | 'right' | 'center', isWatched: boolean, onClick?: () => void }) {
  
  const [hover, setHover] = useState(false)
  const c = useTranslations('Common')

  return (
    <motion.div className="w-auto md:aspect-video group z-0 relative"
    initial={{zIndex: "0"}}
    animate={{zIndex: hover ? 1 : 0}}
    style={{ transformOrigin: position || 'center' }}
    whileHover={{scale : 1.5, zIndex: "1", transition: {duration: 0.5, ease: "backOut"}}}
    onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    onClick={onClick}>
      {
        isWatched?
        <>
        <div className="absolute top-0 left-0 bg-black w-full h-full opacity-25 text-center"></div>
        <div className="absolute flex justify-center items-center w-full h-full"> <span className="text-white">{c('watched')}</span></div>
        </>
        :
        <>
        </>
      }
      
      <Image src={info.poster_path || '/dicsord.svg'} alt={info.title || 'test'} width={1000} height={1000}
      className="w-full h-full -z-10 object-cover rounded-lg group-hover:rounded-b-none"/>
      <div className="absolute bottom-[10%] p-2 px-4 z-10 text-white font-bold text-xs lg:text-lg inline-block">{info.title}</div>
      <div className="top-0 absolute w-full h-full z-0 bg-gradient-to-b from-transparent to-black/70 rounded-lg group-hover:rounded-b-none"></div>

      {hover && <CardInfoExtension info={info} />}
    </motion.div>
  )
}