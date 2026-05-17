'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'

export default function Header() {
  const { locale, setLocale, t } = useTranslation()

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🀄</span>
          <span className="text-xl font-bold text-gray-800">
            {locale === 'zh' ? '熊猫汉语' : 'Panda Chinese'}
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/reading"
            className="text-gray-600 hover:text-orange-500 font-medium transition-colors"
          >
            {t('nav.reading')} 📖
          </Link>
          <Link
            href="/learn"
            className="text-gray-600 hover:text-orange-500 font-medium transition-colors"
          >
            {t('nav.learn')} 📝
          </Link>
          <button
            onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
            className="ml-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors border border-gray-200"
          >
            {locale === 'zh' ? 'EN' : '中文'}
          </button>
        </nav>
      </div>
    </header>
  )
}
