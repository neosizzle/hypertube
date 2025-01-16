"use client"

import { useEffect, useRef, useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ShowCard from "@/components/ShowCard";
import { FullInfo, ShortInfo } from "../../../types/ShowInfo";
import ShowInfoModal from "@/components/ShowInfoModal";

export default function Browse() {

  const [trending, setTrending] = useState<ShortInfo[]>([])
  const [openModal, setOpenModal] = useState(false)
  const [showInfo, setShowInfo] = useState<FullInfo | null>(null)
  const showInfoCache = useRef<{ [key: string]: FullInfo }>({});

  useEffect(() => {

    fetch(`http://localhost:8000/api/show/popular?type=movie`, {
      method: 'GET',
    }).then((data) => {
      if (data.ok) data.json().then((json) => setTrending(json))
    }).catch((error) => console.error(error))
  }, [])

  const handleClickShowCard = (data: ShortInfo) => {

    if (!(data.id in showInfoCache.current)) {
      console.log("Not in cache")

      fetch(`http://localhost:8000/api/show/info?id=${data.id}&type=${data.type}`, {
        method: 'GET',
      }).then((resp) => {
        if (resp.ok) resp.json().then((json) => {
          showInfoCache.current[data.id.toString() + data.type] = json
          setShowInfo(json)
          setOpenModal(true)
        })
      }).catch((error) => console.error(error))
    } else {
      setShowInfo(showInfoCache.current[data.id.toString() + data.type])
      setOpenModal(true)
    }
  }

  return (
    <div className="h-auto w-full bg-white flex flex-col justify-between">
      <Header />
      <div className="h-auto flex flex-col justify-center py-10 mb-auto">
        <div className="font-bold text-2xl text-black py-4 text-center lg:text-center px-4">Popular Shows</div>
        <div className='flex flex-row flex-wrap gap-2 justify-center'>
          {
            trending.map((info, i) => (<ShowCard info={info} key={i} onClick={() => handleClickShowCard(info)}/>))
          }
        </div>
      </div>
      <ShowInfoModal open={openModal} onClose={() => setOpenModal(false)} info={showInfo}/>
      <Footer />
    </div>
  );
}