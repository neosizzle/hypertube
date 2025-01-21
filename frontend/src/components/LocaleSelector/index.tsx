import { locales } from "@/i18n/config"
import { setUserLocale } from "@/services/locale"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"



export default function LocaleSelector({ className }: { className?: string }) {

  const l = useTranslations('Locales')
  const [selectedLocale, setSelectedLocale] = useState(useLocale())

  const changeLang = async (locale: string) => {
    setUserLocale(locale)
    setSelectedLocale(locale)
  }

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