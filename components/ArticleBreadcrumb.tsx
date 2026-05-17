'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'
import type { Level } from '@/lib/types'

interface ArticleBreadcrumbProps {
  level: Level | undefined
  articleLevel: number
}

export default function ArticleBreadcrumb({ level, articleLevel }: ArticleBreadcrumbProps) {
  const { t } = useTranslation()

  return (
    <div className="mb-6">
      <Link
        href={`/reading?level=${articleLevel}`}
        className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
      >
        ← {level?.emoji} {t(`level.${articleLevel}.name`)}
      </Link>
    </div>
  )
}
