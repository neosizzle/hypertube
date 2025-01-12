'use client'

import Footer from "@/components/footer";
import Header from "@/components/header";
import { SearchContext } from "@/providers/SearchProvider";
import { useContext } from "react";

import { ShowInfo, SeriesData } from "@/components/ShowCard";
import ShowCard from "@/components/ShowCard"

let squid_game: ShowInfo = {
  title: "Squid Game",
  type: "series",
  data: {
    no_seasons: 2,
    info: [
      {
        season_no: 1,
        no_episodes: 9,
        year:2021
      },
      {
        season_no: 2,
        no_episodes: 7,
        year:2024
      },
    ]
  } as SeriesData,
  imdb: 8.0,
  mal: 4.5,
  summary: "Lorem ipsum dolor sit amet",
  genres: ["Action", "Drama", "Mystery"],
  produced_by: "bobo",
  cast: [],
  cover: "/discord.svg"
}

function ResultRow() {
  return (
    <div className="flex flex-row space-x-2 items-center justify-center">
      <ShowCard info={squid_game} />
      <ShowCard info={squid_game} />
      <ShowCard info={squid_game} />
      <ShowCard info={squid_game} />
      <ShowCard info={squid_game} />
      <ShowCard info={squid_game} />
    </div>
  )
}

export default function Search() {

  const { searchQuery, setSearchQuery } = useContext(SearchContext);

  return (
    <div className="h-auto w-full overflow-x-hidden bg-white flex flex-col justify-between">
      <Header />
      <div className="h-auto flex flex-col justify-center py-10 px-16 mb-auto space-y-8 overflow-y-hidden">
        <div className="text-black text-4xl font-medium pt-12">Search results for: "{searchQuery}"</div>
        <div className="space-y-24 py-12">
          <ResultRow />
          <ResultRow />
          <ResultRow />
          <ResultRow />
        </div>
      </div>
      <Footer />
    </div>
  )
}