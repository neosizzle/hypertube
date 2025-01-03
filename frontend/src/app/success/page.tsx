"use client"

import { redirect, useRouter } from "next/navigation"
import { Router } from "next/router"
import { useEffect, useState } from "react"


// ! going to find a way to change this soon

export default function Success() {

  const [authProvider, setAuthProvider] = useState('')
  const [rawUser, setRawUser] = useState('')
  const router = useRouter()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')! // split based on my backend specs

    const provider = state.split('_')[0]
    setAuthProvider(provider)

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
      if (!data.ok) router.push('/login')
      return data.json()
    })
    .then((body) => {
      setRawUser(JSON.stringify(body))
    })
    .catch((error) => {
      console.error(error)
      router.push('/login')
    })
  }, [])

  useEffect(() => {
    if (rawUser) {
      router.push('/browse')
    }
  }, [rawUser])

  return (
    <div>
      Successfully authenticated with {authProvider}!
      <div>
        {rawUser}
      </div>
    </div>
  )
}