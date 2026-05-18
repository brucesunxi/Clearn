'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { AdBanner } from '@/lib/adsense'
import type { Article } from '@/lib/types'
import CheckInCalendar from '@/components/CheckInCalendar'
import FlashcardSession from '@/components/FlashcardSession'
import QuizSession from '@/components/QuizSession'

interface LearnPageClientProps {
  articles: Article[]
}

type Mode = 'flashcard' | 'quiz'

export default function LearnPageClient({ articles }: LearnPageClientProps) {
  const { t, locale } = useTranslation()
  const [mode, setMode] = useState<Mode>('flashcard')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('learn.title')}</h1>
      <p className="text-gray-400 mb-8">{t('learn.subtitle')}</p>

      <div className="mb-8">
        <CheckInCalendar />
      </div>

      <AdBanner />

      {/* Mode tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('flashcard')}
          className={`flex-1 py-3 rounded-xl text-base font-medium transition-all ${
            mode === 'flashcard'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          📚 {locale === 'zh' ? '闪卡学习' : 'Flashcards'}
        </button>
        <button
          onClick={() => setMode('quiz')}
          className={`flex-1 py-3 rounded-xl text-base font-medium transition-all ${
            mode === 'quiz'
              ? 'bg-purple-500 text-white shadow-sm'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          🎯 {locale === 'zh' ? '单词测验' : 'Word Quiz'}
        </button>
      </div>

      {mode === 'flashcard' ? (
        <FlashcardSession articles={articles} />
      ) : (
        <QuizSession articles={articles} />
      )}
    </div>
  )
}
