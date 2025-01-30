"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
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

// removes underscore and capitalizes each word
function formatJSONKey(key : string) {
  return key.split('_').map((s : string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

function RegisterCard() {

  const un_ref = useRef<HTMLInputElement>(null)
  const pw_ref = useRef<HTMLInputElement>(null)
  const email_ref = useRef<HTMLInputElement>(null)
  const fn_ref = useRef<HTMLInputElement>(null)
  const ln_ref = useRef<HTMLInputElement>(null)

  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const router = useRouter()
  const t = useTranslations('Common')

  const handleRegister = () => {

    fetch('http://localhost:8000/api/users', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: un_ref.current?.value,
        first_name: fn_ref.current?.value,
        last_name: ln_ref.current?.value,
        email: email_ref.current?.value,
        password: pw_ref.current?.value,
      })
    })
    .then((data) => {
      if (data.ok) {
        setSuccess(true)
      } else {
        data.json().then((obj) => {
          const key = Object.keys(obj)[0]
          const msg = (obj[key][0].includes('unique') ? formatJSONKey(key) + ' is already taken.' : obj[key][0])
          setErrorMsg(formatJSONKey(key) + ": " + msg)
        })
      }
    })
    .catch((error) => {
      console.error(error)
    })
  }

  useEffect(() => { if (success) router.push('/login') }, [success, router])

  return (
    <div className="flex flex-col w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/4 h-[29rem] lg:h-[40rem] bg-gradient-to-br from-purple-200 to-[#9EFCFF]
    rounded-lg drop-shadow-lg px-12 lg:px-20 pb-12 pt-8 lg:pt-16 space-y-4">
      <div className="text-black text-2xl lg:text-4xl font-semibold lg:pb-3">{t('register')}</div>
      <motion.input className="h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base" placeholder={t('username')} ref={un_ref} initial={exit} animate={enter}/>
      <motion.input className="h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base" placeholder={t('password')} ref={pw_ref} initial={exit} animate={enter}/>
      <motion.input className="h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base" placeholder={t('email')} ref={email_ref} initial={exit} animate={enter}/>
      <motion.input className="h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base" placeholder={t('firstName')} ref={fn_ref} initial={exit} animate={enter}/>
      <motion.input className="h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base" placeholder={t('lastName')} ref={ln_ref} initial={exit} animate={enter}/>
      {errorMsg !== '' && <motion.div className="flex justify-center items-center text-red-500 text-[0.6rem] lg:text-sm"
      initial={exit}
      animate={enter}>
        {errorMsg}
      </motion.div>}
      <motion.button className="h-8 lg:h-12 bg-purple-400 rounded-lg p-1 font-bold font-white text-sm lg:text-base
      hover:scale-105 hover:drop-shadow-sm transition-all" onClick={handleRegister} initial={exit} animate={enter}>{t('register')}</motion.button>
      <div className="flex flex-row text-black text-[0.6rem] lg:text-xs space-x-2 items-center justify-center">
        <Link href="/login" className="text-blue-500 underline cursor-pointer">{t('logIn')}</Link>
        <div>{t('or')}</div>
        <Link href="/reset" className="text-blue-500 underline cursor-pointer">{t("resetPassword")}</Link>
      </div>
    </div> 
  )
}

export default function Register() {
  return (
    <div className="flex flex-col h-screen w-screen bg-white items-center justify-center space-y-4">
      <LocaleSelector className="absolute my-2 mx-8 top-0 right-0 w-48 h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base
      items-center px-2 bg-transparent hover:bg-black/10 outline-none"/>
      <div className="font-bold text-black text-base lg:text-2xl">hypertube</div>
      <RegisterCard key="register-card"/>
    </div>
  )
}