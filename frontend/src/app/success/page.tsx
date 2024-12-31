"use client"

import { redirect } from "next/navigation"
import { useEffect, useState } from "react"

export default function Success() {

  const [authProvider, setAuthProvider] = useState('')

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    if (state !== null)
      setAuthProvider(state)
    const redirect_uri = `${window.location.protocol}//${window.location.host}${window.location.pathname}`

    fetch(`http://localhost:8000/oauth/${state}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        redirect_uri: redirect_uri
      })
    })
    .catch((error) => {
      console.error(error)
    })

  }, [])

  return (
    <div>
      Successfully authenticated with {authProvider}!
    </div>
  )
}