'use client'

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { SearchContext } from "@/providers/SearchProvider";
import { useContext, useEffect, useRef, useState } from "react";

import ShowInfoModal from "@/components/ShowInfoModal";
import { FullInfo, ShortInfo } from "../../types/ShowInfo";
import { useDebounce } from "@/hooks/useDebounce";
import ShowCard from "@/components/ShowCard";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useInView } from "react-intersection-observer";

type InfiniteScrollShowGridProps = {
  query: string
  handleClickShowCard: (data: ShortInfo) => void
}

export function InfiniteScrollSearchResults({ query, handleClickShowCard }: InfiniteScrollShowGridProps) {

  const { isSm } = useBreakpoint("sm")
  const { isMd } = useBreakpoint("md")
  const { isLg } = useBreakpoint("lg")
  const { isXl } = useBreakpoint("xl")
  const { is2xl } = useBreakpoint("2xl")

  const [scrollTrigger, isInView] = useInView();
  const [results, setResults] = useState<ShortInfo[]>([])
  const [hasMoreData, setHasMoreData] = useState(true)
  const [nextPage, setNextPage] = useState(2)

  useEffect(() => {
    
    if (query === '') return

    fetch(`http://localhost:8000/api/show/search?query=${encodeURIComponent(query)}&page=1`, {
      method: 'GET',
    }).then((data) => {
      if (data.ok) data.json().then((json) => setResults(json.results))
    }).catch((error) => console.error(error))

    setHasMoreData(true);
    setNextPage(2);
  }, [query]);

  const getCardPosition = (index: number) => {

    const isFirstInRow = (index: number) => {
      if (is2xl) return (index % 6 == 0)
      if (isXl) return (index % 5 == 0)
      if (isLg) return (index % 4 == 0)
      if (isMd) return (index % 3 == 0)
      if (isSm) return (index % 2 == 0)
    }

    const isLastInRow = (index: number) => {
      if (is2xl) return (index % 6 == 5)
      if (isXl) return (index % 5 == 4)
      if (isLg) return (index % 4 == 3)
      if (isMd) return (index % 3 == 2)
      if (isSm) return (index % 2 == 1)
    }

    return (isFirstInRow(index) ? "left" : (isLastInRow(index) ? "right" : "center"))
  }

  const load = () => {

    if (!hasMoreData) return

    fetch(`http://localhost:8000/api/show/search?query=${encodeURIComponent(query)}&page=${nextPage}`, {
      method: 'GET',
    }).then((data) => {
      if (data.ok) data.json().then((json) => {
        setResults((prevResults) => [...prevResults, ...json.results])
        setNextPage((currPage) => currPage + 1)
        if (results.length === 0) setHasMoreData(false)
      })
    }).catch((error) => console.error(error))
  }

  useEffect(() => {
    if (isInView && hasMoreData) {
      load();
    }
  }, [isInView, hasMoreData]);

  return (
    <>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 
        gap-x-2 gap-y-2 md:gap-y-16 lg:gap-y-20 justify-center lg:justify-start'>
        {
          results?.map((info, i) => (<ShowCard info={info} key={i} onClick={() => handleClickShowCard(info)} position={getCardPosition(i)}/>))
        }
      </div>
      <div>
        {(hasMoreData && <div ref={scrollTrigger}>Loading...</div>) || (
          <p>No more posts to load</p>
        )}
      </div>
    </>
  )
}

export default function Search() {

  const { searchQuery, setSearchQuery } = useContext(SearchContext);
  const [openModal, setOpenModal] = useState(false)
  const [showInfo, setShowInfo] = useState<FullInfo | null>(null)


  const [debounceQuery, setDebounceQuery] = useState('')
  const debounce = useDebounce(searchQuery, 2000)
  useEffect(() => setDebounceQuery(searchQuery), [debounce])

  const handleClickShowCard = (data: ShortInfo) => {
    fetch(`http://localhost:8000/api/show/info?id=${data.id}&type=${data.type}`, {
      method: 'GET',
    }).then((resp) => {
      if (resp.ok) resp.json().then((json) => {
        setShowInfo(json)
        setOpenModal(true)
      })
    }).catch((error) => console.error(error))
  }

  return (
    <div className="h-screen w-full overflow-x-hidden bg-white flex flex-col justify-between">
      <Header />
      <div className="h-auto w-full flex flex-col justify-center py-10 px-10 lg:px-16 mb-auto space-y-8">
        <div className="text-black text-sm lg:text-4xl font-medium pt-12">Search results for: "{searchQuery}"</div>
        <InfiniteScrollSearchResults query={debounceQuery} handleClickShowCard={handleClickShowCard}/>
      </div>
      <ShowInfoModal open={openModal} onClose={() => setOpenModal(false)} info={showInfo}/>
      <Footer />
    </div>
  )
}