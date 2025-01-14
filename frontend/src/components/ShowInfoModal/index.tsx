"use client"

import { useEffect, useRef } from "react";
import Image from "next/image"
import Modal from "../modal";
import { FullInfo } from "../../../types/ShowInfo";
import Link from "next/link";

function Video({ id } : { id: number}) {

  return (
    <Link href={`/watch/${id}`} className="w-full flex flex-row p-4 space-x-4 hover:bg-black/10 rounded-lg">
      <div className="flex justify-center items-center text-2xl text-black">2</div>
      <div className="w-[20%] aspect-video bg-black rounded-xl"></div>
      <div className="text-black flex-col space-y-1">
        <div className="font-bold text-2xl">Episode 2</div>
        <div className="font-medium">Lorem ipsum dolor sit amet</div>
      </div>
    </Link>
  )
}

function Movie() {

  return (
    <div className="px-12">
      <Video id={1}/>
    </div>
  )

}

function Episodes() {

  return (
    <div className="px-8 space-y-4">
      <div className="flex flex-row justify-between items-center p-4">
        <div className="text-black text-bold text-4xl">Episodes</div>
        <select className="text-black w-auto px-2 selection:font-medium text-xl bg-transparent hover:bg-black/10 outline-none rounded-lg">
          <option>Season 1</option>
          <option>Season 2</option>
        </select>
      </div>
      <div className="overflow-y-auto">
        <Video id={1}/>
        <Video id={2}/>
        <Video id={3}/>
        <Video id={4}/>
        <Video id={5}/>
        <Video id={1}/>
        <Video id={2}/>
        <Video id={3}/>
        <Video id={4}/>
        <Video id={5}/>
        <Video id={1}/>
        <Video id={2}/>
        <Video id={3}/>
        <Video id={4}/>
        <Video id={5}/>
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
            <Image src={info.Poster === 'N/A' ? '/discord.svg' : info.Poster} alt={info.Title} width={1920} height={1000}
            className="w-full aspect-video z-0 object-cover rounded-lg opacity-80"/>
            <div className="absolute bottom-[10%] px-12 z-10 text-black font-bold text-4xl inline-block">{info.Title}</div>
            <div className="absolute top-0 w-full aspect-video z-0 bg-gradient-to-b from-transparent from-30% to-90% to-white rounded-lg"></div>
          </div>
          <div className="px-12 text-black font-medium">
            {info.Plot}
          </div>
          {info.Type === "series" ? <Episodes /> : <Movie />}
          
        </div>
      </div>
    </Modal>
  )
}
