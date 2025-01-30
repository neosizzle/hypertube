"use client"

import { Key, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image"
import Modal from "../modal";
import { FullInfo, MovieInfo, TVInfo, TVSeasonInfo, EpisodeInfo, Cast, Crew } from "../../types/ShowInfo";
import { useRouter } from "next/navigation";
import { SearchContext } from "@/providers/SearchProvider";
import { Season } from "@/types/ShowInfo";

function Episode({ info } : { info: EpisodeInfo }) {

  const router = useRouter()
  const { setSearchQuery, setIsOpen } = useContext(SearchContext);

  const parseDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  const getAiringDate = (dateString: string) => {
    
    const date = parseDate(dateString)
    const daysUntil = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const weeksUntil = Math.ceil(daysUntil / 7)

    if (daysUntil > 0 && daysUntil <= 7)
      return ('Airing in ' + daysUntil + ' day' + (daysUntil > 1 ? 's': ''))
    else if (daysUntil > 7 && daysUntil <= 31)
      return ('Airing in ' + weeksUntil + ' week' + (weeksUntil > 1 ? 's': ''))

    return ('Airing in ' + parseDate(info.air_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long'}))
  }

  const getSubTitle = () => {

    if (info.air_date && info.runtime) {
      return ((parseDate(info.air_date).getTime() < Date.now()) ? info.runtime + 'm' : getAiringDate(info.air_date))
    } else if (info.air_date) {
      return (getAiringDate(info.air_date))
    } else if (info.runtime) {
      return (info.runtime + 'm')
    }
    return ('')
  }

  const handleClick = () => {
    setSearchQuery('')
    setIsOpen(false)

    fetch(`http://localhost:8000/api/videos/fromTMDB?tmdb_id=${info.id}&type=tv`).then((resp) => {
      if (resp.ok) resp.json().then((data) => router.push(`/watch/${data.video_id}`))
    }).catch((error) => console.error(error))
  }

  return (
    <button className="w-full flex flex-row px-4 lg:px-4 py-2 lg:py-4 space-x-2 lg:space-x-4 hover:bg-black/10 rounded-lg"
    onClick={handleClick}>
      <div className="flex w-3 lg:w-5 justify-center items-center text-md lg:text-2xl text-black">{info.episode_number}</div>
      <Image src={info.still_path} alt={info.title !== '' ? info.title : `Episode ${info.episode_number}`} width={1920} height={1000}
      className="w-24 lg:w-48 aspect-video object-cover z-0 rounded-lg"/>
      <div className="text-black flex-col space-y-1 w-[40rem]">
        <div className="flex flex-row justify-between items-center">
          <div className="font-bold text-sm lg:text-lg line-clamp-1 lg:line-clamp-2 text-ellipsis text-left">{info.title !== '' ? info.title : `Episode ${info.episode_number}`}</div>
          <div className="text-xs lg:text-lg hidden md:block">{getSubTitle()}</div>
        </div>
        <div className='text-xs md:text-md lg:text-lg text-ellipsis line-clamp-2 text-left'>{info.overview}</div>
      </div>
    </button>
  )
}

function Movie({info}: { info: FullInfo}) {

  const router = useRouter()
  const { setSearchQuery, setIsOpen } = useContext(SearchContext);

  const handleClick = () => {
    setSearchQuery('')
    setIsOpen(false)

    fetch(`http://localhost:8000/api/videos/fromTMDB?tmdb_id=${info.id}&type=movie`).then((resp) => {
      if (resp.ok) resp.json().then((data) => router.push(`/watch/${data.video_id}`))
    }).catch((error) => console.error(error))
  }

  return (
    <div className="px-4 lg:px-12 lg:py-4">
      <button className="w-full flex flex-row space-x-4 hover:bg-black/10 rounded-lg"
      onClick={handleClick}>
        <Image src={info.poster_path} alt={info.title} width={1920} height={1000}
        className="w-24 lg:w-48 aspect-video object-cover z-0 rounded-lg"/>
          <div className="text-black flex-col space-y-1 w-full">
            <div className="flex flex-row justify-between items-center">
            <div className="font-bold text-base lg:text-lg">{'Full Movie'}</div>
          <div className="text-xs md:text-md lg:text-lg">{(info.details as MovieInfo).runtime + 'm'}</div>
          </div>
        </div>
      </button>
    </div>
  )
}



function Credits({info}: { info: FullInfo}) {

  const buildCreditsMap = (data: Cast[] | Crew[]) => {

    const map: { [key: string]: string[] } = {}

    data.forEach((c) => {
      if (c.known_for_department in map) {
        map[c.known_for_department].push(c.name)
      } else {
        map[c.known_for_department] = [c.name]
      }
    })

    return (map)
  }
  
  const castMap = buildCreditsMap(info.credits.cast)
  const crewMap = buildCreditsMap(info.credits.crew)

  return (
    <div className="px-4 lg:px-12 text-black font-medium space-y-1">
      <div>Starring: {[...new Set(castMap['Acting'])].slice(0, 3).join(', ')}</div>
      <div>Directed by: {[...new Set(crewMap['Directing'])].slice(0, 2).join(', ')}</div>
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
    <div className="lg:px-8 space-y-4 w-full">
      <div className="flex flex-row justify-between items-center px-4 w-full">
        <div className="text-black text-bold text-lg lg:text-3xl">Episodes</div>
        <select className="text-black w-auto h-12 items-center px-2 text-xs md:text-md lg:text-lg bg-transparent hover:bg-black/10 outline-none rounded-lg"
        onChange={(e) => setSeasonNum(Number(e.target.value))}>
          {
            (info.details as TVInfo).seasons.map((s: Season, index: Key | null | undefined) =><option key={index} value={s.season_number as number}>{'S' + s.season_number + ': ' + s.name}</option>)
          }
        </select>
      </div>
      <div className="px-4 text-black text-xs md:text-md lg:text-lg">{episodes && episodes.overview}</div>
      <div className="overflow-y-auto w-full">
        {
          episodes && episodes.episodes.map((e: EpisodeInfo, index: Key | null | undefined) => (<Episode key={index} info={e}/>))
        }
      </div>
    </div>
  )

}

export default function ShowInfoModal({ open, onClose, info }: { open: boolean, onClose: () => void, info: FullInfo | null }) {

  const ref = useRef<HTMLDivElement>(null)

  if (info === null)
    return (<></>)

  return (
    <Modal open={open}>
      <div
      className="flex w-screen h-full justify-center items-start"
      onClick={(e) => (!ref.current?.contains(e.target as Node)) ? onClose() : ''}
      >
      <div className={`flex w-screen h-full justify-center items-start py-12 ${open ? 'overflow-auto' : 'overflow-hidden'}`}>
        <div className="flex flex-col w-[85%] lg:w-1/2 h-auto pb-8 bg-white rounded-lg " ref={ref}>
          <div className="w-full aspect-video relative">
            <Image src={info.backdrop_path} alt={info.title} width={1920} height={1000}
            className="w-full aspect-video z-0 object-cover rounded-lg"/>
            <div className="absolute bottom-0 lg:bottom-[5%] px-4 lg:px-12 z-10 text-black font-bold text-xl lg:text-5xl inline-block">{info.title}</div>
            <div className="absolute top-0 w-full aspect-video z-0 bg-gradient-to-b from-transparent from-40% to-90% to-white rounded-lg" />
          </div>
          <div className="space-y-4">
            <div className="px-4 lg:px-12 text-black text-xs md:text-sm lg:text-md xl:text-lg font-medium">
              {info.overview}
            </div>
            <div className="flex flex-col md:flex-row">
              <div className="text-xs md:text-md lg:text-lg space-y-1 w-2/3">
                {info.original_title !== info.title && <div className="px-4 lg:px-12 text-black inline-block">Original Title: {info.original_title}</div>}
                <div className="px-4 lg:px-12 text-black font-medium">
                  Genres: {info.genres.map((g) => g.name).join(', ')}
                </div>
                <Credits info={info}/>
              </div>
              <div className="text-xs md:text-md lg:text-lg space-y-1 pt-1 md:pt-0 text-black px-4 md:px-0">
                <div>Ratings:</div>
                <div className="flex flex-row items-center space-x-4">
                  <Image src="/imdb.svg" alt="imdb" width={25} height={25} className="w-5 h-5 lg:w-8 lg:h-8" />
                  <div>{info.details.imdb_rating} / 10.0</div>
                </div>
              </div>
            </div>
            {info.type === "tv" ? <Episodes info={info}/> : <Movie info={info}/>}
          </div>
        </div>
      </div>
      </div>
    </Modal>
  )
}
