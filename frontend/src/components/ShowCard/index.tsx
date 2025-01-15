import { motion, AnimatePresence } from "motion/react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { ShortInfo } from "../../../types/ShowInfo"

function CardInfoExtension({ info } : { info: ShortInfo }) {

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
            <div className="font-medium text-xs text-black">{new Date(info.date).getFullYear()}</div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function ShowCard({ info, position, onClick } : { info: ShortInfo, position?: 'left' | 'right' | 'center', onClick?: () => void }) {
  
  const [hover, setHover] = useState(false)

  return (
    <div className="w-full aspect-video relative" onClick={onClick}>
      <motion.div
      initial={{zIndex: "0"}}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        translateX: '-50%',
        translateY: '-50%',
        width: '100%',
        transformOrigin: position || 'center'
      }}
      whileHover={{scale : 1.5, zIndex: "1", transition: {duration: 0.5, ease: "backOut"}}}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      className="relative group z-0">
        <div className="bg-black aspect-video w-full rounded-lg group-hover:rounded-b-none relative">
          <Image src={info.poster_path || '/dicsord.svg'} alt={info.title || 'test'} width={1000} height={1000}
          className="w-full h-full -z-10 object-cover rounded-lg opacity-80"/>
          <div className="absolute bottom-[10%] px-4 z-10 text-white font-bold text-lg inline-block">{info.title}</div>
          <div className="absolute top-0 w-full h-full z-0 bg-gradient-to-b from-transparent to-black/70 rounded-lg"></div>
        </div>
        {hover && <CardInfoExtension info={info} />}
      </motion.div>
    </div>
  )
}