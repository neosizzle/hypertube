import { locales } from "@/i18n/config"
import { setUserLocale } from "@/services/locale"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function LocaleSelector({ className }: { className?: string }) {

  const l = useTranslations('Locales')
  const [selectedLocale, setSelectedLocale] = useState(useLocale())
  const router = useRouter();

  const changeLang = async (locale: string) => {
    setUserLocale(locale)
    setSelectedLocale(locale)
  }

  useEffect(() => {

    fetch('http://localhost:8000/api/users/me', {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lang: selectedLocale
      })
    }).catch(() => {
      router.push('/error')
    })
  }, [selectedLocale])

  return (
    <select className={className}
    value={selectedLocale}
    onChange={(e) =>  changeLang(e.target.value)}>
      {
        locales.map((locale, i) =>  (<option key={i} value={locale}>{l(locale)}</option>))
      }
    </select>
  )
}