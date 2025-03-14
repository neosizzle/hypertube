'use client'

import { setUserLocale } from "@/services/locale"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Redirect() {

  const [success, setSuccess] = useState(false)
  const router = useRouter()

  // callback code exchange
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state') // split based on my backend specs

    if (!code || !state)
      return router.push('/login')

    const provider = state.split('_')[0]
    const redirect_uri = `${window.location.protocol}//${window.location.host}${window.location.pathname}`

    fetch(`http://localhost:8000/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        state: state,
        redirect_uri: redirect_uri,
        method: provider
      })
    })
    .then((data) => {
      if (data.ok) {
        data.json().then((json) => {
          // console.log(JSON.stringify(json))
          localStorage.setItem('userID', json.id)
          setUserLocale(json.lang)
          setSuccess(true)
        })
      }
      else router.push('/login')
    })
    .catch(() => {
      router.push('/error')
    })
  }, [])

  useEffect(() => {
    if (success) router.push('/browse')
    }, [success, router])

  return (
    <div className="flex flex-grow bg-white h-[100vh] text-black text-xl justify-center items-center">
      Signing you in...
    </div>
  )

}