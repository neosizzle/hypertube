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
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

const parseDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};


export default function Search() {
  
  // search
  const { searchQuery } = useContext(SearchContext);

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

  const router = useRouter();

  // translation
  const c = useTranslations('Common')
  const t = useTranslations('SearchPage')
  

  // debounce search query
  useEffect(() => setDebounceQuery(searchQuery), [debounce]) // eslint-disable-line react-hooks/exhaustive-deps

  // search api call
  useEffect(() => {
    
    if (debounceQuery === '') return

    fetch(`http://localhost:8000/api/show/search?query=${encodeURIComponent(debounceQuery)}&page=1`, {
      method: 'GET',
    }).then((data) => {
      if (data.ok) data.json().then((json) => setResults(json.results))
      else if (data.status == 400)
        data.json().then((data) => alert(data))
    }).catch(() => router.push('/error'))

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
      else if (data.status == 400)
        data.json().then((data) => alert(JSON.stringify(data)))
    }).catch(() => router.push('/error'))
  }

  // load more results for infinite scrolling
  useEffect(() => {
    if (isInView && hasMoreData) {
      load();
    }
  }, [isInView, hasMoreData]);

  // TODO: cancel token here to prevent double request
  const handleClickShowCard = (data: ShortInfo) => {
    setOpenModal(true)

    fetch(`http://localhost:8000/api/show/info?id=${data.id}&type=${data.type}`, {
      method: 'GET',
    }).then((resp) => {
      if (resp.ok) resp.json().then((json) => {
        setShowInfo(json)
      })
      else if (resp.status == 400)
        resp.json().then((data) => alert(JSON.stringify(data)))
    }).catch(() => {
      setOpenModal(false)
      router.push('/error')
    })
  }

  useEffect(() => {
    let finalResults = []
    
    if (filterOption === 'year') {
      finalResults = results.filter((data) => parseDate(data.date) >= fromYear && parseDate(data.date) <= toYear)
    } else if (filterOption === 'type') {
      finalResults = filterType === 'all' ? results : results.filter((data) => data.type === filterType)
    } else {
      finalResults = results
    }
    
    setFilteredResults([...finalResults])

  }, [results, fromYear, toYear, filterOption, filterType])

  return (
    <div className="h-screen w-full overflow-x-hidden bg-white flex flex-col justify-between">
      <Header />
      <div className="h-auto w-full flex flex-col justify-center py-10 px-10 lg:px-16 mb-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between md:pt-12 space-y-4 md:space-y-0">
          <div className="text-black text-md md:text-lg lg:text-4xl font-medium">{t('searchResultsFor') + ": \"" + searchQuery + "\""}</div>
          <div className="flex flex-row text-xs md:text-md lg:text-lg items-center space-x-4">
          <div className="text-black ">{t('sortOrder') + ": "}</div>
          <div>
          <button
          onClick={() => setFilteredResults([...filteredResults.sort((a,b) =>  a.title.localeCompare(b.title))])}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {t('asc')}
          </button>
          <button
          onClick={() => setFilteredResults([...filteredResults.sort((a,b) =>  b.title.localeCompare(a.title))])}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500">
            {t('dsc')}
          </button>
        </div>
            

            <div className="text-black ">{t('filterBy') + ": "}</div>
            <select className="text-black w-auto h-12 items-center px-2 bg-transparent hover:bg-black/10 outline-none rounded-lg"
            onChange={(e) => setFilterOption(e.target.value)}>
              <option key={1} value='none'>{t('none')}</option>
              <option key={2} value='type'>{t('type')}</option>
              <option key={3} value='year'>{t('year')}</option>
            </select>
            {
              filterOption === 'year' &&
              <div className="flex flex-row text-black space-x-4 justify-center items-center">
                <div className="flex w-20 h-10 rounded-md border-2 border-black p-2 space-x-2 justify-center items-center">
                  <input placeholder={t('fromYear')}
                  className="w-full outline-none focus:outline-none focus:ring-0 border-none overflow-hidden bg-transparent"
                  type="number" onInput={(e) => setFromYear((e.target as HTMLInputElement).value === '' ? new Date() : new Date(Number((e.target as HTMLInputElement).value), 0, 1))}/>
                </div>
                <div className="text-black font-bold text-2xl">-</div>
                <div className="flex w-20 h-10 rounded-md border-2 border-black p-2 space-x-2 justify-center items-center">
                  <input placeholder={t('toYear')}
                  className="w-full outline-none focus:outline-none focus:ring-0 border-none overflow-hidden bg-transparent"
                  type="number" onInput={(e) => setToYear((e.target as HTMLInputElement).value === '' ? new Date() : new Date(Number((e.target as HTMLInputElement).value), 11, 31))}/>
                </div>
              </div>
            }
            {
              filterOption === 'type' &&
              <div className="flex flex-row text-black space-x-4 justify-center items-center">
                <select className="text-black w-auto h-12 items-center px-2 bg-transparent hover:bg-black/10 outline-none rounded-lg"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}>
                  <option key={1} value='all'>{t('all')}</option>
                  <option key={2} value='movie'>{c('movie')}</option>
                  <option key={3} value='tv'>{c('tv')}</option>
                </select>
              </div>
            }
          </div>
        </div>
        <ShowGrid data={filteredResults} handleClickShowCard={handleClickShowCard}/>
        <div ref={scrollTrigger}/>
      </div>
      <ShowInfoModal open={openModal} onClose={() => {setOpenModal(false); setShowInfo(null)}} info={showInfo}/>
      <Footer />
    </div>
  )
}