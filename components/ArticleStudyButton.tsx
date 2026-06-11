'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'

interface ArticleStudyButtonProps {
  articleId: string
}

export default function ArticleStudyButton({ articleId }: ArticleStudyButtonProps) {
  const { t } = useTranslation()

  return (
    <Link
      href={`/learn?articleId=${articleId}`}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors shadow-sm"
    >
      📝 {t('reading.studyWords')}
    </Link>
  )
}
