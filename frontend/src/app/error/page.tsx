"use client"

import { useRouter } from "next/navigation";


export default function Users() {
  const router = useRouter()

  return (
	<div className="h-auto w-full bg-white flex flex-col justify-between">
		There is an unexpected error. 
		<div>
			<button onClick={() => router.push('/browse')}>Return to main page</button>
		</div>
	</div>
  )
}