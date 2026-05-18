'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import type { Article } from '@/lib/types'
import ListenSession from './ListenSession'
import SpeakSession from './SpeakSession'
import IntensiveListening from './IntensiveListening'

interface ListenSpeakPageClientProps {
  articles: Article[]
}

type Tab = 'listen' | 'speak' | 'intensive'

export default function ListenSpeakPageClient({ articles }: ListenSpeakPageClientProps) {
  const { t, locale } = useTranslation()
  const [tab, setTab] = useState<Tab>('listen')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          🎧 {t('listenspeak.title')}
        </h1>
        <p className="text-sm text-gray-400">
          {locale === 'zh' ? '听力和口语练习，提升中文听说能力' : 'Practice listening and speaking Chinese'}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('listen')}
          className={`flex-1 py-3 rounded-xl text-base font-medium transition-all ${
            tab === 'listen'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          🎧 {locale === 'zh' ? '选意思' : 'Quiz'}
        </button>
        <button
          onClick={() => setTab('intensive')}
          className={`flex-1 py-3 rounded-xl text-base font-medium transition-all ${
            tab === 'intensive'
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          🎯 {locale === 'zh' ? '精听' : 'Intensive'}
        </button>
        <button
          onClick={() => setTab('speak')}
          className={`flex-1 py-3 rounded-xl text-base font-medium transition-all ${
            tab === 'speak'
              ? 'bg-red-500 text-white shadow-sm'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          🗣️ {t('listenspeak.speak')}
        </button>
      </div>

      {/* Content */}
      {tab === 'listen' && <ListenSession articles={articles} />}
      {tab === 'intensive' && <IntensiveListening articles={articles} />}
      {tab === 'speak' && <SpeakSession articles={articles} />}
    </div>
  )
}
