"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "motion/react"
import { useTranslations } from 'next-intl'
import { redirect, useRouter } from "next/navigation"
import LocaleSelector from "@/components/LocaleSelector"
import React, { useEffect, useRef, useState } from "react"

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

  const t = useTranslations('LoginPage');
  const c = useTranslations('Common') 

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
        placeholder={c('username')} ref={un_ref}
        initial={exit}
        animate={enter}
        />
        <motion.input className="h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base"
        placeholder={c('password')} ref={pw_ref}
        initial={exit}
        animate={enter}
        type="password"
        />
        {signInFailed && <motion.div className="flex justify-center items-center text-red-500 text-[0.6rem] lg:text-sm"
        initial={exit}
        animate={enter}
        >{t('incorrectUsernameOrPassword')}</motion.div>}
        <motion.button className="h-8 lg:h-12 bg-purple-400 rounded-lg p-1 font-bold font-white text-sm lg:text-lg
        hover:scale-105 hover:drop-shadow-sm transition-all" onClick={handleSignIn}
        initial={exit}
        animate={enter}
        >{c('logIn')}</motion.button>
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

  const c = useTranslations('Common')
  
  return (
    <div className="flex flex-col w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/4 h-[29rem] lg:h-[40rem] bg-gradient-to-br from-purple-200 to-[#9EFCFF]
    rounded-lg drop-shadow-lg px-12 lg:px-20 pb-12 pt-8 lg:pt-16 space-y-4">
      <SignInForm onSuccess={onSuccess} />
      <div className="flex flex-row space-x-2 justify-center items-center">
        <hr className="flex-grow border-black"/>
        <div className="text-black text-sm lg:text-lg font-semibold">{c('or')}</div>
        <hr className="flex-grow border-black"/>
      </div>
      <div className="flex flex-col space-y-4">
        <OAuthButton provider="42" icon_src="/42.svg" />
        <OAuthButton provider="discord" icon_src="/discord.svg" />
        <OAuthButton provider="github" icon_src="/github.svg" />
      </div>
      <div className="flex flex-row text-black text-[0.6rem] lg:text-xs space-x-2 items-center justify-center">
        <Link href="/register" className="text-blue-500 underline cursor-pointer">{c('register')}</Link>
        <div>{c('or')}</div>
        <Link href="/reset" className="text-blue-500 underline cursor-pointer">{c('resetPassword')}</Link>
      </div>
    </div>
  )
}

export default function Login() {

  const [success, setSuccess] = useState(false)
  const router = useRouter()

  // check if user already logged in
  useEffect(() => {
    fetch(`http://localhost:8000/api/users/me`, {
      method: 'GET',
      credentials: 'include',
    }).then((data) => {
      if (data.ok) {
        router.push('/browse')
      }
    })
  }, [])
  
  useEffect(() => {
    if (success) router.push('/browse')
  }, [success, router])

  return (
    <div className="flex flex-col h-screen w-screen bg-white items-center justify-center space-y-4">
      <LocaleSelector className="absolute my-2 mx-8 top-0 right-0 w-48 h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base
      items-center px-2 bg-transparent hover:bg-black/10 outline-none" />
      <div className="font-bold text-black text-base lg:text-2xl">hypertube</div>
      <SignInCard onSuccess={() => setSuccess(true)}/>
    </div>
  )
}