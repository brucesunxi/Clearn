'use client'

import { useTranslation } from '@/lib/i18n/context'
import type { Article } from '@/lib/types'
import CheckInCalendar from '@/components/CheckInCalendar'
import FlashcardSession from '@/components/FlashcardSession'

interface LearnPageClientProps {
  articles: Article[]
}

export default function LearnPageClient({ articles }: LearnPageClientProps) {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('learn.title')}</h1>
      <p className="text-gray-400 mb-8">{t('learn.subtitle')}</p>

      <div className="mb-8">
        <CheckInCalendar />
      </div>

      <FlashcardSession articles={articles} />
    </div>
  )
}
