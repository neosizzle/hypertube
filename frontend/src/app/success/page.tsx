"use client"

import { redirect } from "next/navigation"
import { useEffect, useState } from "react"

export default function Success() {

  const [authProvider, setAuthProvider] = useState('')

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')! // split based on my backend specs

    const provider = state.split('_')[0]
    setAuthProvider(provider)

    const redirect_uri = `${window.location.protocol}//${window.location.host}${window.location.pathname}`

    fetch(`http://localhost:8000/oauth/${provider}/token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        state: state,
        redirect_uri: redirect_uri
      })
    })
    .catch((error) => {
      console.error(error)
      redirect('/login')
    })

  }, [])

  return (
    <div>
      Successfully authenticated with {authProvider}!
    </div>
  )
}