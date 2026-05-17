'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import en from './en.json'
import zh from './zh.json'

type Locale = 'en' | 'zh'
type TranslationMap = Record<string, string>

const translations: Record<Locale, TranslationMap> = { en, zh }

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key: string) => key,
})

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (_, key) => {
    const val = params[key]
    return val !== undefined ? String(val) : `{${key}}`
  })
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const saved = localStorage.getItem('chineselearn-locale') as Locale | null
    if (saved === 'en' || saved === 'zh') {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('chineselearn-locale', newLocale)
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const text = translations[locale]?.[key]
      if (text === undefined) {
        // Fallback to English if key not found
        const fallback = translations['en']?.[key]
        return fallback !== undefined ? interpolate(fallback, params) : key
      }
      return interpolate(text, params)
    },
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  return useContext(I18nContext)
}
