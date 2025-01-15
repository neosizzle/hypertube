"use client"

import { useEffect, useRef, useState } from "react";
import Image from "next/image"
import Modal from "../modal";
import { FullInfo, MovieInfo, TVInfo, TVSeasonInfo, EpisodeInfo } from "../../../types/ShowInfo";
import Link from "next/link";

function Video({ id, title, content, numbering } : { id: number, numbering?: number, title: string ,content: string}) {

  return (
    <Link href={`/watch/${id}`} className="w-full flex flex-row p-4 space-x-4 hover:bg-black/10 rounded-lg">
      <div className="flex justify-center items-center text-2xl text-black">{numbering}</div>
      <div className="w-[20%] aspect-video bg-black rounded-xl"></div>
      <div className="text-black flex-col space-y-1">
        <div className="font-bold text-2xl">{title}</div>
        <div className="font-medium text-ellipsis">{content}</div>
      </div>
    </Link>
  )
}

function Episode({ info } : { info: EpisodeInfo }) {

  return (
    <Link href={`/watch/${info.id}`} className="w-full flex flex-row p-4 space-x-4 hover:bg-black/10 rounded-lg">
      <div className="flex w-5 justify-center items-center text-2xl text-black">{info.episode_number}</div>
      <Image src={info.still_path} alt={info.title !== '' ? `Episode ${info.episode_number}` : info.title} width={1920} height={1000}
      className="w-48 aspect-video object-cover z-0 rounded-lg"/>
      <div className="text-black flex-col space-y-1 w-[30rem]">
        <div className="flex flex-row justify-between">
          <div className="font-bold text-lg">{info.title !== '' ? `Episode ${info.episode_number}` : info.title}</div>
          <div className="text-medium">{info.runtime + 'm'}</div>
        </div>
        <div className="font-medium text-ellipsis line-clamp-3">{info.overview}</div>
      </div>
    </Link>
  )
}


function Movie({info}: { info: FullInfo}) {

  return (
    <div className="px-12 py-4">
      <Video id={1} title={"Movie"} content={""} />
    </div>
  )

}

function Episodes({info}: { info: FullInfo}) {

  const [seasonNum, setSeasonNum] = useState((info.details as TVInfo).seasons[0].season_number)
  const [episodes, setEpisodes] = useState<TVSeasonInfo | null>(null)
  
  useEffect(() => {
    fetch(`http://localhost:8000/api/show/tv/season?id=${info.id}&season_number=${seasonNum}`, {
      method: 'GET',
    }).then((data) => {
      if (data.ok) data.json().then((json) => setEpisodes(json))
    }).catch((error) => console.error(error))
  }, [seasonNum, info])

  return (
    <div className="px-8 space-y-4">
      <div className="flex flex-row justify-between items-center p-4">
        <div className="text-black text-bold text-4xl">Episodes</div>
        <select className="text-black w-auto px-2 selection:font-medium text-xl bg-transparent hover:bg-black/10 outline-none rounded-lg"
        onChange={(e) => setSeasonNum(Number(e.target.value))}>
          {
            (info.details as TVInfo).seasons.map((s, index) => <option key={index} value={s.season_number as number}>{'S' + s.season_number + ': ' + s.name}</option>)
          }
        </select>
      </div>
      <div className="overflow-y-auto">
        {
          episodes && episodes.episodes.map((e, index) => (<Episode key={index} info={e}/>))
        }
      </div>
    </div>
  )

}

export default function ShowInfoModal({ open, onClose, info }: { open: boolean, onClose: () => void, info: FullInfo | null }) {

  const ref = useRef<HTMLDivElement>(null)

  // useEffect(() => {
  //   if (open) {
  //     document.body.style.overflow = 'hidden';
  //     document.body.style.paddingRight = '16px';
  //   } else {
  //     document.body.style.overflow = 'visible';
  //     document.body.style.paddingRight = '0px';
  //   }
  //   return () => {
  //     document.body.style.overflow = 'visible';
  //     document.body.style.paddingRight = '0px';
  //   };
  // }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => { document.removeEventListener("mousedown", handleClickOutside) }
  }, [ref])


  if (info === null)
    return (<></>)

  return (
    <Modal open={open}>
      <div className={`flex w-screen h-full justify-center items-start py-12 ${open ? 'overflow-auto' : 'overflow-hidden'}`}>
        <div className="flex flex-col w-1/2 h-auto pb-8 bg-white rounded-lg " ref={ref}>
          <div className="w-full aspect-video relative">
            <Image src={info.backdrop_path} alt={info.title} width={1920} height={1000}
            className="w-full aspect-video z-0 object-cover rounded-lg"/>
            <div className="absolute bottom-[10%] px-12 z-10 text-black font-bold text-4xl inline-block">{info.title}</div>
            <div className="absolute top-0 w-full aspect-video z-0 bg-gradient-to-b from-transparent from-40% to-90% to-white rounded-lg"></div>
          </div>
          <div className="px-12 text-black font-medium">
            {info.overview}
          </div>
          {info.type === "tv" ? <Episodes info={info}/> : <Movie info={info}/>}
          
        </div>
      </div>
    </Modal>
  )
}
