'use client'

import Footer from "@/components/footer";
import Header from "@/components/header";
import { SearchContext } from "@/providers/SearchProvider";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

import ShowCard from "@/components/ShowCard"
import { useSSR } from "react-i18next";
import ShowInfoModal from "@/components/ShowInfoModal";
import { FullInfo, ShortInfo } from "../../../types/ShowInfo";

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

function useDebounce(cb: any, delay: number) {
  const [debounceValue, setDebounceValue] = useState(cb);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceValue(cb);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [cb, delay]);
  return debounceValue;
}

export default function Search() {

  const { searchQuery, setSearchQuery } = useContext(SearchContext);
  const [debounceQuery, setDebounceQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[][]>([])
  const [openModal, setOpenModal] = useState(false)
  const [showInfo, setShowInfo] = useState<FullInfo | null>(null)


  const showInfoCache = useRef<{ [key: string]: FullInfo }>({});

  const debounce = useDebounce(searchQuery, 3000)

  useEffect(() => {
    console.log("Debounced:", searchQuery);
    setDebounceQuery(searchQuery);
  }, [debounce]);

  useEffect(() => {

    if (debounceQuery === '') return

    console.log("called search api with " + searchQuery)
    fetch(`http://localhost:8000/api/search?query=${encodeURIComponent(searchQuery)}`, {
      method: 'GET',
    }).then((data) => {
      if (data.ok) data.json().then((json) => setSearchResults(json))
    }).catch((error) => console.error(error))
  }, [debounceQuery])

  const handleClickShowCard = (data: ShortInfo) => {

    if (!(data.imdbID in showInfoCache.current)) {
      console.log("Not in cache")

      fetch(`http://localhost:8000/api/info?imdb_id=${data.imdbID}`, {
        method: 'GET',
      }).then((resp) => {
        if (resp.ok) resp.json().then((json) => {
          showInfoCache.current[data.imdbID] = json as FullInfo
          setShowInfo(json)
        })
      }).catch((error) => console.error(error))
    } else setShowInfo(showInfoCache.current[data.imdbID])

    setOpenModal(true)
  }

  return (
    <div className="h-screen w-full overflow-x-hidden bg-white flex flex-col justify-between">
      <Header />
      <div className="h-auto w-full flex flex-col justify-center py-10 px-16 mb-auto space-y-8 overflow-y-hidden">
        <div className="text-black text-4xl font-medium pt-12">Search results for: "{searchQuery}"</div>
        <div className="space-y-24 py-12 pb-24 w-full">
          { searchResults.map((chunk, i) => <ResultRow key={i} data={chunk} onClick={handleClickShowCard}/> )}
        </div>
      </div>
      <ShowInfoModal open={openModal} onClose={() => setOpenModal(false)} info={showInfo}/>
      <Footer />
    </div>
  )
}