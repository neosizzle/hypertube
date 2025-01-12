"use client"

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react"
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useRouter } from "next/navigation";

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

export default function Browse() {

  return (
    <div className="h-auto w-full bg-white flex flex-col justify-between">
      <Header />
      <div className="h-screen flex flex-col justify-center py-10 px-16 mb-auto space-y-8">
        <div className="space-y-3">
          <div className="font-bold text-2xl text-black">New on hypertube</div>
          <div className="flex flex-row space-x-2 items-center justify-center">
            <ShowCard info={squid_game} />
            <ShowCard info={squid_game} />
            <ShowCard info={squid_game} />
            <ShowCard info={squid_game} />
            <ShowCard info={squid_game} />
            <ShowCard info={squid_game} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}