"use client"

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {

  const router = useRouter()

  useEffect(() => {
    router.push('/browse')
  }, [])

  return (
    <div className="h-screen w-screen bg-white space-y-4 text-black"></div>
  );
}