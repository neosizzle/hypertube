"use client"

import Link from "next/link"
import React, { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import LocaleSelector from "@/components/LocaleSelector"

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

function ResetPasswordCard() {

  const timeout = 30
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)
  const codeButton = useRef<HTMLButtonElement>(null)
  const emailInput = useRef<HTMLInputElement>(null)
  const codeInput = useRef<HTMLInputElement>(null)
  const pwInput = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const c = useTranslations('Common')
  const t = useTranslations('ResetPasswordPage')

  const handleSendCode = async () => {

    if (!codeButton.current)
      return

    codeButton.current.innerHTML = `Sent`
    codeButton.current.className = `h-8 lg:h-12 w-32 bg-purple-200 rounded-lg p-2 font-semibold font-white text-[0.6rem] md:text-xs lg:text-sm xl:text-base`

    const data = await fetch('http://localhost:8000/api/auth/otp', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: emailInput?.current?.value
      }),
    })
    
    if (!data.ok) {
      data.json().then((obj) => { setErrorMsg(obj[Object.keys(obj)[0]])})
      return
    }

    // cooldown
    let seconds = timeout

    codeButton.current.disabled = true

    const id = setInterval(() => {
      seconds--
      if (codeButton.current) codeButton.current.innerHTML = `Sent | ${seconds}s`
    }, 1000)

    setTimeout(() => {
      clearInterval(id)
      if (codeButton.current) {
        codeButton.current.innerHTML = 'Send Code'
        codeButton.current.className = `h-8 lg:h-12 w-32 bg-purple-400 rounded-lg p-2 font-semibold font-white text-[0.6rem] md:text-xs lg:text-sm xl:text-base
        hover:scale-105 hover:drop-shadow-sm transition-all`
        codeButton.current.disabled = false
      }
    }, seconds * 1000)
  }

  const handleResetPassword = () => {

    fetch('http://localhost:8000/api/auth/reset', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        otp: codeInput.current?.value,
        password: pwInput.current?.value
      }),
    }).then((data) => {

      if (!data.ok) {
        data.json().then((obj) => { setErrorMsg(obj[Object.keys(obj)[0]]) })
      } else {
        setSuccess(true)
      }
    }).catch(() => {
      router.push('/error')
    })

  }

  useEffect(() => { if (success === true) router.push('/reset/success') }, [success, router])
  
  return (
    <div className="flex flex-col w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/4 h-[29rem] lg:h-[40rem] bg-gradient-to-br from-purple-200 to-[#9EFCFF]
    rounded-lg drop-shadow-lg px-12 lg:px-20 pb-12 pt-8 lg:pt-16 space-y-4">
      <div className="text-black text-2xl lg:text-4xl font-semibold">{c('resetPassword')}</div>
      <div className="text-black text-sm lg:text-base font-normal">{t('instructions')}</div>
      <input className="h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base" placeholder={c('email')} ref={emailInput}/>
      <input className="h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base" placeholder={t('newPassword')} ref={pwInput} type="password"/>
      <div className="flex flex-row justify-between space-x-2">
        <input className="h-8 lg:h-12 w-full xl:w-2/3 bg-white rounded-lg p-2 text-black text-xs lg:text-base" placeholder={t('code')} ref={codeInput}/>
          <button className="h-8 lg:h-12 w-32 bg-purple-400 rounded-lg p-2 font-semibold font-white text-[0.6rem] md:text-xs lg:text-sm xl:text-base
          hover:scale-105 hover:drop-shadow-sm transition-all"
          onClick={handleSendCode} ref={codeButton}>
            {t('sendCode')}
          </button>
      </div>
      {errorMsg !== '' && <motion.div className="flex justify-center items-center text-red-500 text-[0.6rem] lg:text-sm"
      initial={exit}
      animate={enter}>
        {errorMsg}
      </motion.div>}
      <button className="h-8 lg:h-12 bg-purple-400 rounded-lg p-1 font-bold font-white text-sm lg:text-lg
      hover:scale-105 hover:drop-shadow-sm transition-all" onClick={handleResetPassword}>{c('resetPassword')}</button>
      <div className="flex flex-row text-black text-[0.6rem] lg:text-xs space-x-2 items-center justify-center">
        <Link href="/login" className="text-blue-500 underline cursor-pointer">{c('logIn')}</Link>
        <div>or</div>
        <Link href="/register" className="text-blue-500 underline cursor-pointer">{c('register')}</Link>
      </div>
    </div>
  )
}

export default function Reset() {

  return (
    <div className="flex flex-col h-screen w-screen bg-white items-center justify-center space-y-4">
      <LocaleSelector className="absolute my-2 mx-8 top-0 right-0 w-48 h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base
      items-center px-2 bg-transparent hover:bg-black/10 outline-none"/>
      <div className="font-bold text-black text-base lg:text-2xl">hypertube</div>
      <ResetPasswordCard />
    </div>
  )
}