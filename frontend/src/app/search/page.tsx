'use client'

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { SearchContext } from "@/providers/SearchProvider";
import { useContext, useEffect, useRef, useState } from "react";

import ShowInfoModal from "@/components/ShowInfoModal";
import { FullInfo, ShortInfo } from "../../types/ShowInfo";
import { useDebounce } from "@/hooks/useDebounce";
import ShowGrid from "@/components/ShowGrid";

export default function Search() {

  const { searchQuery, setSearchQuery } = useContext(SearchContext);
  const [debounceQuery, setDebounceQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ShortInfo[]>([])
  const [openModal, setOpenModal] = useState(false)
  const [showInfo, setShowInfo] = useState<FullInfo | null>(null)
  const showInfoCache = useRef<{ [key: string]: FullInfo }>({});
  const debounce = useDebounce(searchQuery, 1000)

  useEffect(() => { setDebounceQuery(searchQuery) }, [debounce]);

  useEffect(() => {

    if (debounceQuery === '') return

    fetch(`http://localhost:8000/api/show/search?query=${encodeURIComponent(searchQuery)}`, {
      method: 'GET',
    }).then((data) => {
      if (data.ok) data.json().then((json) => setSearchResults(json))
    }).catch((error) => console.error(error))
  }, [debounceQuery])

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
    <div className="h-screen w-full overflow-x-hidden bg-white flex flex-col justify-between">
      <Header />
      <div className="h-auto w-full flex flex-col justify-center py-10 px-10 lg:px-16 mb-auto space-y-8">
        <div className="text-black text-sm lg:text-4xl font-medium pt-12">Search results for: "{searchQuery}"</div>
        <ShowGrid data={searchResults} handleClickShowCard={handleClickShowCard}/>
      </div>
      <ShowInfoModal open={openModal} onClose={() => setOpenModal(false)} info={showInfo}/>
      <Footer />
    </div>
  )
}