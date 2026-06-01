'use client'

import { useEffect, useState } from 'react'
import { incrementReadingCount, getReadingRewardStatus, ReadingRewardStatus } from '@/lib/reading-reward'
import ReadingRewardToast from './ReadingRewardToast'
import { AdBanner } from '@/lib/adsense'
import ArticleContent from './ArticleContent'
import WordList from './WordList'
import ArticleStudyButton from './ArticleStudyButton'
import ArticleBreadcrumb from './ArticleBreadcrumb'
import type { Article, Level } from '@/lib/types'
import { trackActivity } from '@/lib/activity'

interface ArticlePageClientProps {
  article: Article
  level?: Level
}

export default function ArticlePageClient({ article, level }: ArticlePageClientProps) {
  const [status, setStatus] = useState<ReadingRewardStatus | null>(null)

  useEffect(() => {
    // 增加阅读计数并获取状态
    incrementReadingCount()
    const currentStatus = getReadingRewardStatus()
    setStatus(currentStatus)
    // 记录用户行为
    trackActivity('article_read', { articleId: article.id, level: article.level })
  }, [])

  if (!status) {
    return <div className="max-w-5xl mx-auto px-4 py-8">Loading...</div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <ArticleBreadcrumb level={level} articleLevel={article.level} />
      <ReadingRewardToast status={status} articleId={article.id} />

      {/* Main content - always accessible */}
      <ArticleContent article={article} />

      <AdBanner />

      {/* Vocabulary list */}
      <WordList vocabulary={article.vocabulary} articleId={article.id} />

      {/* Learn this lesson's words */}
      <div className="mt-8 text-center">
        <ArticleStudyButton />
      </div>
    </div>
  )
}
