"use client"

import { redirect, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import React, { useEffect, useRef, useState, useTransition } from "react"
import { motion } from "motion/react"

import { useLocale, useTranslations } from 'next-intl'
import { locales } from "@/i18n/config"
import { setUserLocale } from "@/services/locale"

const enter = {
  opacity: 1,
  transition: {
    duration: 0.3
  },
}

const exit = {
  opacity: 0,
  transition: {
    duration: 0.3
  },
}

function SignInForm({ onSuccess }: { onSuccess: () => void }) {

  const t  = useTranslations('LoginPage');

  const [signInFailed, setSignInFailed] = useState(false)
  const un_ref = useRef<HTMLInputElement>(null)
  const pw_ref = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleSignIn = () => {

    if (!un_ref.current?.value || !pw_ref.current?.value)
        return

    fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: un_ref.current?.value,
        password: pw_ref.current?.value,
        method: 'username'
      })
    })
    .then((data) => {
      if (!data.ok) {
        setSignInFailed(true)
      } else {
        onSuccess()
      }

      // log in success
      return data.json()
    })
    .then((body) => {
      console.log(JSON.stringify(body))
    })
    .catch((error) => {
      console.error(error)
      router.push('/login')
    })
  }

  return (
    <>
      <div className="text-black text-2xl lg:text-4xl font-semibold lg:pb-3">{t('welcomeBack')}</div>
        <motion.input className="h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base"
        placeholder={t('username')} ref={un_ref}
        initial={exit}
        animate={enter}
        />
        <motion.input className="h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base"
        placeholder={t('password')} ref={pw_ref}
        initial={exit}
        animate={enter}
        />
        {signInFailed && <motion.div className="flex justify-center items-center text-red-500 text-[0.6rem] lg:text-sm"
        initial={exit}
        animate={enter}
        >{t('incorrectUsernameOrPassword')}</motion.div>}
        <motion.button className="h-8 lg:h-12 bg-purple-400 rounded-lg p-1 font-bold font-white text-sm lg:text-lg
        hover:scale-105 hover:drop-shadow-sm transition-all" onClick={handleSignIn}
        initial={exit}
        animate={enter}
        >{t('logIn')}</motion.button>
    </>
  )
}

function OAuthButton({ provider, icon_src }: { provider: string, icon_src: string }) {

  const t = useTranslations('LoginPage')

  return (
    <motion.button
      className="flex flex-row bg-white rounded-lg h-8 lg:h-12 px-4 space-x-3 items-center hover:scale-105 hover:drop-shadow-sm transition-all"
      onClick={() => {redirect(`http://localhost:8000/api/oauth?provider=${provider}`)}}
      initial={exit}
      animate={enter}
      >
      <Image className="w-5 h-auto lg:w-8" src={icon_src} alt={provider} width={20} height={64}/>
      <div className="text-black text-xs lg:text-base">{t('continueWith') + ' ' + provider.charAt(0).toUpperCase() + provider.slice(1)}</div>
    </motion.button>
  )
}

function SignInCard({ onSuccess }: { onSuccess: () => void }) {

  const t = useTranslations('LoginPage')
  
  return (
    <div className="flex flex-col w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/4 h-[29rem] lg:h-[40rem] bg-gradient-to-br from-purple-200 to-[#9EFCFF]
    rounded-lg drop-shadow-lg px-12 lg:px-20 pb-12 pt-8 lg:pt-16 space-y-4">
      <SignInForm onSuccess={onSuccess} />
      <div className="flex flex-row space-x-2 justify-center items-center">
        <hr className="flex-grow border-black"/>
        <div className="text-black text-sm lg:text-lg font-semibold">{t('or')}</div>
        <hr className="flex-grow border-black"/>
      </div>
      <div className="flex flex-col space-y-4">
        <OAuthButton provider="42" icon_src="/42.svg" />
        <OAuthButton provider="discord" icon_src="/discord.svg" />
        <OAuthButton provider="github" icon_src="/github.svg" />
      </div>
      <div className="flex flex-row text-black text-[0.6rem] lg:text-xs space-x-2 items-center justify-center">
        <Link href="/register" className="text-blue-500 underline cursor-pointer">{t('register')}</Link>
        <div>{t('or')}</div>
        <Link href="/reset" className="text-blue-500 underline cursor-pointer">{t('resetPassword')}</Link>
      </div>
    </div>
  )
}

export default function Login() {

  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const t = useTranslations('Locales')
  
  const [isPending, startTransition] = useTransition()

  const changeLang = async (locale: string) => {
    setUserLocale(locale)
    console.log("Change lang to : " + locale)
  }

  // callback code exchange
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state') // split based on my backend specs

    if (!code || !state)
      return

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
        setSuccess(true)
        data.json().then((json) => {
          console.log(JSON.stringify(json))
          localStorage.setItem('userID', json.id)
          changeLang(json.lang)
        })
      }
    })
    .catch((error) => {
      console.error(error)
    })
  }, [])
  
  useEffect(() => {
    if (success) router.push('/browse')
    }, [success])

  return (
    <div className="flex flex-col h-screen w-screen bg-white items-center justify-center space-y-4">
      <select className="absolute my-2 mx-8 top-0 right-0 w-48 h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base
      items-center px-2 bg-transparent hover:bg-black/10 outline-none"
      onChange={(e) => startTransition(() => changeLang(e.target.value))}>
        {
          locales.map((locale, i) =>  (<option key={i} value={locale}>{t(locale)}</option>))
        }
      </select>
      <div className="font-bold text-black text-base lg:text-2xl">hypertube</div>
      <SignInCard onSuccess={() => setSuccess(true)}/>
    </div>
  )
}