"use client"

import { useEffect, useRef, useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ShowCard from "@/components/ShowCard";
import { FullInfo, ShortInfo } from "../../../types/ShowInfo";
import ShowInfoModal from "@/components/ShowInfoModal";

function ResultRow({ data, onClick }: { data: any[], onClick: (data: ShortInfo) => void }) {

  useEffect(() => {
    console.log(data)
  }, [data])

  return (
    <div className="grid grid-cols-6 w-full gap-2 items-center justify-start">
      {data.map((info, i) => (
        <ShowCard
        info={info}
        key={i}
        position={i === 0 ? "left" : (i === 5 ? "right" : "center")}
        onClick={() => onClick(info)}/>
      ))}
    </div>
  )
}

function chunkArray(array: any[], chunkSize: number) {

  let chunks = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return (chunks)
}


export default function Browse() {

  const [trending, setTrending] = useState<any[][]>([[]])
  const [openModal, setOpenModal] = useState(false)
  const [showInfo, setShowInfo] = useState<FullInfo | null>(null)
  const showInfoCache = useRef<{ [key: string]: FullInfo }>({});

  useEffect(() => {

    fetch(`http://localhost:8000/api/show/popular?type=movie`, {
      method: 'GET',
    }).then((data) => {
      if (data.ok) data.json().then((json) => setTrending(chunkArray(json, 6)))
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
      <div className="h-auto flex flex-col justify-center py-10 px-16 mb-auto space-y-8">
        <div className="font-bold text-2xl text-black">Popular Shows</div>
        <div className="space-y-24 pb-12 w-full">
          { trending.map((chunk, i) => <ResultRow key={i} data={chunk} onClick={handleClickShowCard}/> )}
        </div>
      </div>
      <ShowInfoModal open={openModal} onClose={() => setOpenModal(false)} info={showInfo}/>
      <Footer />
    </div>
  );
}