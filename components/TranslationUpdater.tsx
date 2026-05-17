'use client'

import { useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/context'

export default function TranslationUpdater() {
  const { locale, t } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
    document.title = t('site.title')
  }, [locale, t])

  useEffect(() => {
    const footer = document.getElementById('site-footer')
    if (footer) {
      footer.textContent = t('site.footer')
    }
  }, [locale, t])

  return null
}
