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
import AuthWall from './AuthWall'
import VerifyWall from './VerifyWall'

interface ArticlePageClientProps {
  article: Article
  level?: Level
}

export default function ArticlePageClient({ article, level }: ArticlePageClientProps) {
  const { user, loading } = useAuth()
  const { locale } = useTranslation()
  const [status, setStatus] = useState<ReadingRewardStatus | null>(null)

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

  // 未登录显示登录墙
  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <ArticleBreadcrumb level={level} articleLevel={article.level} />
        <div className="mt-4">
          <ArticleContent article={article} previewMode />
        </div>
        <div className="mt-8">
          <AuthWall
            title={locale === 'zh' ? '阅读完整文章' : 'Read Full Article'}
            description={locale === 'zh' ? '阅读完整内容需要登录账号。注册即送 500 金币开始学习！' : 'Log in to read the full article. Sign up to get 500 coins!'}
          />
        </div>
      </div>
    )
  }

  if (!user.emailVerified) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <VerifyWall />
      </div>
    )
  }

  if (!status) {
    return <div className="max-w-5xl mx-auto px-4 py-8">Loading...</div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <ArticleBreadcrumb level={level} articleLevel={article.level} />
      <ReadingRewardToast status={status} articleId={article.id} />

      {/* Main content */}
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
