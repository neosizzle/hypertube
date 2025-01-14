"use client"

import { useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function Browse() {

  const [openShowInfo, setOpenShowInfo] = useState(false)

  return (
    <div className="h-auto w-full bg-white flex flex-col justify-between">
      <Header />
      <div className="h-screen flex flex-col justify-center py-10 px-16 mb-auto space-y-8">
        <div className="space-y-3">
          {/* <div className="font-bold text-2xl text-black">New on hypertube</div>
          <div className="flex flex-row space-x-2 items-center justify-center">
            <ShowCard info={squid_game} position="left" onClick={() => setOpenShowInfo(true)}/>
            <ShowCard info={squid_game} />
            <ShowCard info={squid_game} />
            <ShowCard info={squid_game} />
            <ShowCard info={squid_game} />
            <ShowCard info={squid_game} position="right"/>
          </div> */}
        </div>
      </div>
      {/* <ShowInfoModal open={openShowInfo} onClose={() => setOpenShowInfo(false)} info={squid_game}/> */}
      <Footer />
    </div>
  );
}