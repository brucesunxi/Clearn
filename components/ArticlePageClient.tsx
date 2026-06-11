'use client'

import { useEffect, useRef, useMemo, useState, useCallback } from 'react'
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
import { hasSignupModalBeenShown, markSignupModalShown } from '@/lib/signup-guard'
import SignupModal from './SignupModal'
import { speak, cancelSpeech, pauseSpeech, resumeSpeech } from '@/lib/tts'
import ReadAlongBar from './ReadAlongBar'

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
  // 防止 user 引用变化导致重复上报（auth-context 在 visibilitychange 时重新 fetchUser）
  const hasTrackedRef = useRef<string | null>(null)
  const articleId = article.id
  const [signupShown, setSignupShown] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // 阅读滚动监听：访客滚动到预览末尾时弹出注册引导
  useEffect(() => {
    if (isFullAccess || !sentinelRef.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasSignupModalBeenShown()) {
        setSignupShown(true)
      }
    }, { threshold: 0.3 })
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [isFullAccess])

  const handleSignupClose = () => {
    setSignupShown(false)
    markSignupModalShown()
  }

  // ---- 整课跟读 ----
  // Flat list of all sentences with their paragraph/sentence indices
  type SentenceItem = { paraIdx: number; sentIdx: number; text: string }
  const sentenceQueue = useMemo<SentenceItem[]>(() => {
    const queue: SentenceItem[] = []
    const paras = isFullAccess ? article.paragraphs : article.paragraphs.slice(0, Math.max(2, Math.ceil(article.paragraphs.length / 2)))
    paras.forEach((p, pi) => {
      const sentences = p.text.split(/(?<=[。！？!?])/).filter(Boolean)
      sentences.forEach((s, si) => queue.push({ paraIdx: pi, sentIdx: si, text: s }))
    })
    return queue
  }, [article.paragraphs, isFullAccess])

  const [playState, setPlayState] = useState<'stopped' | 'playing' | 'paused'>('stopped')
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0)
  const [playSpeed, setPlaySpeed] = useState(1)
  const sentinelRefForReadAlong = useRef<HTMLDivElement>(null)

  const sentenceHighlight = playState !== 'stopped' && sentenceQueue[currentSentenceIdx]
    ? { paraIdx: sentenceQueue[currentSentenceIdx].paraIdx, sentIdx: sentenceQueue[currentSentenceIdx].sentIdx }
    : null

  const playSentence = useCallback((idx: number) => {
    if (idx >= sentenceQueue.length) {
      setPlayState('stopped')
      setCurrentSentenceIdx(0)
      return
    }
    setCurrentSentenceIdx(idx)
    setPlayState('playing')
    speak(sentenceQueue[idx].text, {
      rate: playSpeed,
      onEnd: () => playSentence(idx + 1),
    })
  }, [sentenceQueue, playSpeed])

  const handlePlay = () => {
    if (playState === 'paused') {
      resumeSpeech()
      setPlayState('playing')
    } else {
      if (currentSentenceIdx >= sentenceQueue.length) setCurrentSentenceIdx(0)
      playSentence(currentSentenceIdx)
    }
  }

  const handlePause = () => {
    pauseSpeech()
    setPlayState('paused')
  }

  const handleStop = () => {
    cancelSpeech()
    setPlayState('stopped')
    setCurrentSentenceIdx(0)
  }

  const handleSpeedChange = (speed: number) => {
    setPlaySpeed(speed)
    if (playState === 'playing' && currentSentenceIdx < sentenceQueue.length) {
      cancelSpeech()
      playSentence(currentSentenceIdx)
    }
  }

  useEffect(() => {
    if (!user) return
    // 同一篇文章只上报一次
    if (hasTrackedRef.current === articleId) return
    hasTrackedRef.current = articleId

    // 增加阅读计数并获取状态
    incrementReadingCount()
    const currentStatus = getReadingRewardStatus()
    setStatus(currentStatus)
    // 记录用户行为
    trackActivity('article_read', { articleId: article.id, level: article.level })
    fetch('/api/adventure/energy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activity: 'article_read' }) }).catch(() => {})
  }, [user, article])

  // 加载中
  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-8">Loading...</div>
  }

  if (isFullAccess && !status) {
    return <div className="max-w-5xl mx-auto px-4 py-8">Loading...</div>
  }

  return (
    <><div className="max-w-5xl mx-auto px-4 py-8">
      <ArticleBreadcrumb level={level} articleLevel={article.level} />

      {/* Reading reward toast only for full access */}
      {isFullAccess && status && (
        <ReadingRewardToast status={status} articleId={article.id} />
      )}

      {/* Main content — preview for guests, full for others */}
      <ArticleContent article={article} previewMode={!isFullAccess} sentenceHighlight={sentenceHighlight} />

      {/* 阅读滚动锚点：访客滚动到此处时弹出注册引导 */}
      {!isFullAccess && <div ref={sentinelRef} className="h-2" />}

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

      {/* Vocabulary list and study button — 访客可见但点击弹窗 */}
      {user && user.emailVerified ? (
        <>
          <WordList vocabulary={article.vocabulary} articleId={article.id} />
          <div className="mt-8 text-center">
            <ArticleStudyButton articleId={article.id} />
          </div>
        </>
      ) : user ? (
        // 已登录未验证 → 点学习按钮弹验证提示
        <>
          <div className="mt-8" onClick={() => setBannerType('verify')}>
            <WordList vocabulary={article.vocabulary} articleId={article.id} />
          </div>
          <div className="mt-8 text-center" onClick={() => setBannerType('verify')}>
            <ArticleStudyButton articleId={article.id} />
          </div>
        </>
      ) : (
        // 未登录访客 → 点学习按钮弹注册引导
        <>
          <div className="mt-8" onClick={() => setSignupShown(true)}>
            <WordList vocabulary={article.vocabulary} articleId={article.id} />
          </div>
          <div className="mt-8 text-center" onClick={() => setSignupShown(true)}>
            <ArticleStudyButton articleId={article.id} />
          </div>
        </>
      )}

      {/* 注册引导弹窗 */}
      {signupShown && (
        <SignupModal type="register" locale={locale} onClose={handleSignupClose} />
      )}
    </div>

      {/* 整课跟读控制条 */}
      <ReadAlongBar
        playState={playState}
        speed={playSpeed}
        current={currentSentenceIdx}
        total={sentenceQueue.length}
        locale={locale}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onSpeedChange={handleSpeedChange}
      />
    </>
  )
}