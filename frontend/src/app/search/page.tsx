'use client'

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { SearchContext } from "@/providers/SearchProvider";
import { useContext, useEffect, useState } from "react";

import ShowInfoModal from "@/components/ShowInfoModal";
import { FullInfo, ShortInfo } from "../../types/ShowInfo";
import { useDebounce } from "@/hooks/useDebounce";
import { useInView } from "react-intersection-observer";
import ShowGrid from "@/components/ShowGrid";

const parseDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};


export default function Search() {
  
  // search
  const { searchQuery, setSearchQuery } = useContext(SearchContext);

  // modal & content
  const [openModal, setOpenModal] = useState(false)
  const [showInfo, setShowInfo] = useState<FullInfo | null>(null)

  // debounce
  const [debounceQuery, setDebounceQuery] = useState('')
  const debounce = useDebounce(searchQuery, 2000)
  
  // infinite scroll
  const [scrollTrigger, isInView] = useInView();
  const [hasMoreData, setHasMoreData] = useState(true)
  const [nextPage, setNextPage] = useState(2)
  
  const [results, setResults] = useState<ShortInfo[]>([])
  const [filterOption, setFilterOption] = useState('none')
  const [fromYear, setFromYear] = useState<Date>(new Date(0))
  const [toYear, setToYear] = useState<Date>(new Date())
  const [filterType, setFilterType] = useState('all')
  const [filteredResults, setFilteredResults] = useState(results)
  
  // debounce search query
  useEffect(() => setDebounceQuery(searchQuery), [debounce])

  // search api call
  useEffect(() => {
    
    if (debounceQuery === '') return

    fetch(`http://localhost:8000/api/show/search?query=${encodeURIComponent(debounceQuery)}&page=1`, {
      method: 'GET',
    }).then((data) => {
      if (data.ok) data.json().then((json) => setResults(json.results))
    }).catch((error) => console.error(error))

    setHasMoreData(true);
    setNextPage(2);
  }, [debounceQuery]);

  // next results page call
  const load = () => {

    if (!hasMoreData) return

    fetch(`http://localhost:8000/api/show/search?query=${encodeURIComponent(debounceQuery)}&page=${nextPage}`, {
      method: 'GET',
    }).then((data) => {
      if (data.ok) data.json().then((json) => {
        setResults((prevResults) => [...prevResults, ...json.results])
        setNextPage((currPage) => currPage + 1)
        if (results.length === 0) setHasMoreData(false)
      })
    }).catch((error) => console.error(error))
  }

  // load more results for infinite scrolling
  useEffect(() => {
    if (isInView && hasMoreData) {
      load();
    }
  }, [isInView, hasMoreData]);

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

  useEffect(() => {

    if (filterOption === 'year') {
      setFilteredResults(results.filter((data) => parseDate(data.date) >= fromYear && parseDate(data.date) <= toYear))
    } else if (filterOption === 'type') {
      setFilteredResults(filterType === 'all' ? results : results.filter((data) => data.type === filterType))
    } else {
      setFilteredResults(results)
    }
  
  }, [results, fromYear, toYear, filterOption, filterType])

  return (
    <div className="h-screen w-full overflow-x-hidden bg-white flex flex-col justify-between">
      <Header />
      <div className="h-auto w-full flex flex-col justify-center py-10 px-10 lg:px-16 mb-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between md:pt-12 space-y-4 md:space-y-0">
          <div className="text-black text-md md:text-lg lg:text-4xl font-medium">Search results for: "{searchQuery}"</div>
          <div className="flex flex-row text-xs md:text-md lg:text-lg items-center space-x-4">
            <div className="text-black ">Filter by: </div>
            <select className="text-black w-auto h-12 items-center px-2 bg-transparent hover:bg-black/10 outline-none rounded-lg"
            onChange={(e) => setFilterOption(e.target.value)}>
              <option key={1} value='none'>None</option>
              <option key={2} value='type'>Type</option>
              <option key={3} value='year'>Year</option>
            </select>
            {
              filterOption === 'year' &&
              <div className="flex flex-row text-black space-x-4 justify-center items-center">
                <div className="flex w-20 h-10 rounded-md border-2 border-black p-2 space-x-2 justify-center items-center">
                  <input placeholder="From"
                  className="w-full outline-none focus:outline-none focus:ring-0 border-none overflow-hidden bg-transparent"
                  type="number" onInput={(e) => setFromYear((e.target as HTMLInputElement).value === '' ? new Date() : new Date(Number((e.target as HTMLInputElement).value), 0, 1))}/>
                </div>
                <div className="text-black font-bold text-2xl">-</div>
                <div className="flex w-20 h-10 rounded-md border-2 border-black p-2 space-x-2 justify-center items-center">
                  <input placeholder="To"
                  className="w-full outline-none focus:outline-none focus:ring-0 border-none overflow-hidden bg-transparent"
                  type="number" onInput={(e) => setToYear((e.target as HTMLInputElement).value === '' ? new Date() : new Date(Number((e.target as HTMLInputElement).value), 11, 31))}/>
                </div>
              </div>
            }
            {
              filterOption === 'type' &&
              <div className="flex flex-row text-black space-x-4 justify-center items-center">
                <select className="text-black w-auto h-12 items-center px-2 bg-transparent hover:bg-black/10 outline-none rounded-lg"
                onChange={(e) => setFilterType(e.target.value)}>
                  <option key={1} value='all'>All</option>
                  <option key={2} value='movie'>Movie</option>
                  <option key={3} value='tv'>TV Series</option>
                </select>
              </div>
            }
          </div>
        </div>
        <ShowGrid data={filteredResults} handleClickShowCard={handleClickShowCard}/>
        <div ref={scrollTrigger}/>
      </div>
      <ShowInfoModal open={openModal} onClose={() => setOpenModal(false)} info={showInfo}/>
      <Footer />
    </div>
  )
}