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
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from '@/lib/i18n/context'
import TrialBanner from './TrialBanner'

interface ArticlePageClientProps {
  article: Article
  level?: Level
}

export default function ArticlePageClient({ article, level }: ArticlePageClientProps) {
  const { user, loading } = useAuth()
  const { locale } = useTranslation()
  const [status, setStatus] = useState<ReadingRewardStatus | null>(null)
  const [bannerType, setBannerType] = useState<'register' | 'verify' | null>(null)
  const isFullAccess = user && user.emailVerified

  useEffect(() => {
    if (!user) return
    // 增加阅读计数并获取状态
    incrementReadingCount()
    const currentStatus = getReadingRewardStatus()
    setStatus(currentStatus)
    // 记录用户行为
    trackActivity('article_read', { articleId: article.id, level: article.level })
  }, [user, article])

  // 加载中
  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-8">Loading...</div>
  }

  if (isFullAccess && !status) {
    return <div className="max-w-5xl mx-auto px-4 py-8">Loading...</div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <ArticleBreadcrumb level={level} articleLevel={article.level} />

      {/* Reading reward toast only for full access */}
      {isFullAccess && status && (
        <ReadingRewardToast status={status} articleId={article.id} />
      )}

      {/* Main content — preview for guests, full for others */}
      <ArticleContent article={article} previewMode={!isFullAccess} />

      <AdBanner />

      {/* For guests: show register banner after content preview */}
      {!user && (
        <div className="mt-8">
          <TrialBanner type="register" />
        </div>
      )}

      {/* For unverified: show verify banner */}
      {user && !user.emailVerified && (
        <div className="mt-8">
          <TrialBanner type="verify" />
        </div>
      )}

      {/* Dismissable banner triggered by action */}
      {bannerType && (
        <TrialBanner type={bannerType} onClose={() => setBannerType(null)} />
      )}

      {/* Vocabulary list and study button — full access only */}
      {isFullAccess && (
        <>
          <WordList vocabulary={article.vocabulary} articleId={article.id} />
          <div className="mt-8 text-center">
            <ArticleStudyButton />
          </div>
        </>
      )}
    </div>
  )
}
