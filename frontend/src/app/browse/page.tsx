"use client"

import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FullInfo, ShortInfo } from "../../types/ShowInfo";
import ShowInfoModal from "@/components/ShowInfoModal";
import ShowGrid from "@/components/ShowGrid";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function Browse() {

  const t = useTranslations('BrowsePage')

  const [trending, setTrending] = useState<ShortInfo[]>([])
  const [openModal, setOpenModal] = useState(false)
  const [showInfo, setShowInfo] = useState<FullInfo | null>(null)
  const showInfoCache = useRef<{ [key: string]: FullInfo }>({});
  const router = useRouter();

  useEffect(() => {

    fetch(`http://localhost:8000/api/show/popular?type=movie`, {
      method: 'GET',
    }).then((data) => {
      if (data.ok) data.json().then((json) => setTrending(json))
    }).catch(() => router.push('/error'))
  }, [])

  // TODO: cancel token here to prevent double request
  const handleClickShowCard = (data: ShortInfo) => {
    setOpenModal(true)

    if (!(data.id in showInfoCache.current)) {
      // console.log("Not in cache")

      fetch(`http://localhost:8000/api/show/info?id=${data.id}&type=${data.type}`, {
        method: 'GET',
      }).then((resp) => {
        if (resp.ok) resp.json().then((json) => {
          showInfoCache.current[data.id.toString() + data.type] = json
          setShowInfo(json)
          setOpenModal(true)
        })
        else if (resp.status == 400)
          resp.json().then((data) => alert(data))
        else
          router.push('/login')
      }).catch(() => {
        setOpenModal(false)
        router.push("/error")
      })
    } else {
      setShowInfo(showInfoCache.current[data.id.toString() + data.type])
    }
  }

  return (
    <div className="h-auto w-full bg-white flex flex-col justify-between">
      <Header />
      <div className="h-auto flex flex-col justify-center py-10 px-10 lg:px-16 mb-auto space-y-8">
        <div className="font-bold text-2xl text-black py-4 text-center lg:text-center px-4">{t('popularShows')}</div>
        <ShowGrid data={trending} handleClickShowCard={handleClickShowCard} />
      </div>
      <ShowInfoModal open={openModal} onClose={() => {setOpenModal(false); setShowInfo(null)}} info={showInfo}/>
      <Footer />
    </div>
  );
}