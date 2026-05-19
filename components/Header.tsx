'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'
import { initVoice } from '@/lib/tts'
import SiteLogo from './SiteLogo'

export default function Header() {
  const { locale, setLocale } = useTranslation()
  const [coins, setCoins] = useState(500)

  // Read coins from localStorage + sync to API in background
  useEffect(() => {
    initVoice()
    const read = () => {
      try {
        const raw = localStorage.getItem('panda-inventory')
        if (raw) {
          const inv = JSON.parse(raw)
          setCoins((prev) => (prev !== inv.coins ? inv.coins : prev))
        }
      } catch {}
    }
    read()
    const t = setInterval(read, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <SiteLogo />
        </Link>
        <nav className="flex items-center gap-5">
          <Link
            href="/listen"
            className="text-gray-600 hover:text-blue-500 font-medium transition-colors text-sm"
          >
            🎧 {locale === 'zh' ? '听' : 'Listen'}
          </Link>
          <Link
            href="/speak"
            className="text-gray-600 hover:text-red-500 font-medium transition-colors text-sm"
          >
            🗣️ {locale === 'zh' ? '说' : 'Speak'}
          </Link>
          <Link
            href="/reading"
            className="text-gray-600 hover:text-orange-500 font-medium transition-colors text-sm"
          >
            📖 {locale === 'zh' ? '读' : 'Read'}
          </Link>
          <Link
            href="/import"
            className="text-gray-600 hover:text-indigo-500 font-medium transition-colors text-sm"
          >
            📥 {locale === 'zh' ? '导入' : 'Import'}
          </Link>
          <Link
            href="/blindbox"
            className="text-gray-600 hover:text-purple-500 font-medium transition-colors text-sm"
          >
            🎁 {locale === 'zh' ? '盲盒' : 'Box'}
          </Link>
          <Link
            href="/pet"
            className="text-gray-600 hover:text-green-500 font-medium transition-colors text-sm"
          >
            🐼
          </Link>
          <Link
            href="/pet"
            className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-full hover:bg-yellow-100 transition-colors"
          >
            <span>🪙</span>
            <span className="font-semibold">{coins}</span>
          </Link>
          <button
            onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
            className="px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors border border-gray-200"
          >
            {locale === 'zh' ? 'EN' : '中文'}
          </button>
        </nav>
      </div>
    </header>
  )
}
