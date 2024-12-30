"use client"

import { useEffect } from "react"

export default function Success() {

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')

    fetch(`http://localhost:8000/auth/discord/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        caller_uri: `${window.location.protocol}//${window.location.host}${window.location.pathname}`
      })
    })
    .then((response) => response.json())
    .catch((error) => {
      console.error(error)
    })

  }, [])

  return (
    <div>
      Successfully authenticated with discord!
    </div>
  )
}