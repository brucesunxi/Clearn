'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import type { Level, Article } from '@/lib/types'
import { useCustomArticles } from '@/lib/use-custom-articles'
import ListenSession from './ListenSession'
import { useAuth } from '@/lib/auth-context'
import TrialBanner from './TrialBanner'

interface ListenPageClientProps {
  levels: Level[]
  articles: Article[]
}

export default function ListenPageClient({ levels, articles: baseArticles }: ListenPageClientProps) {
  const { t, locale } = useTranslation()
  const { user, loading } = useAuth()
  const articles = useCustomArticles(baseArticles)
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null)
  const [started, setStarted] = useState(false)
  const [bannerType, setBannerType] = useState<'register' | 'verify' | null>(null)

  // Display: level-filtered only
  const displayArticles = selectedLevelId !== null
    ? articles.filter((a) => a.level === selectedLevelId)
    : articles
  // Session uses all articles from the selected level
  const sessionArticles = displayArticles

  // Reset started when level changes
  useEffect(() => { setStarted(false) }, [selectedLevelId])

  // 加载中
  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>
  }

  if (started) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => setStarted(false)}
          className="mb-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← {locale === 'zh' ? '返回选文' : 'Back to articles'}
        </button>
        <ListenSession key={selectedLevelId ?? 'all'} articles={sessionArticles} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">🎧 {locale === 'zh' ? '听力练习' : 'Listening Practice'}</h1>
        <p className="text-gray-400 text-sm">{locale === 'zh' ? '选择文章范围，听中文选英文' : 'Select articles, listen and choose the meaning'}</p>
      </div>

      {/* Level tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setSelectedLevelId(null) }}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            selectedLevelId === null
              ? 'bg-gray-800 text-white shadow-sm'
              : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          🌐 {locale === 'zh' ? '全部文章' : 'All Articles'}
        </button>
        {levels.map((l) => (
          <button
            key={l.id}
            onClick={() => setSelectedLevelId(selectedLevelId === l.id ? null : l.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              selectedLevelId === l.id
                ? 'text-white shadow-sm'
                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
            style={selectedLevelId === l.id ? { backgroundColor: l.color } : undefined}
          >
            {l.emoji} {t(`level.${l.id}.name`)}
          </button>
        ))}
      </div>

      {/* Level description */}
      {selectedLevelId !== null && (
        <div className="mb-6 bg-gray-50 rounded-xl px-5 py-3">
          <p className="text-sm text-gray-500">{t(`level.${selectedLevelId}.desc`)}</p>
        </div>
      )}

      {/* Stats */}
      {displayArticles.length > 0 ? (
        <div className="mb-6 flex items-center gap-4 text-sm text-gray-500 justify-center">
          <span>📚 {displayArticles.length} {locale === 'zh' ? '篇文章' : 'articles'}</span>
          <span className="text-gray-300">·</span>
          <span>📝 {displayArticles.reduce((s, a) => s + a.vocabulary.length, 0)} {locale === 'zh' ? '个单词' : 'words'}</span>
        </div>
      ) : (
        <div className="mb-6 text-center py-12 text-gray-400">
          <p className="text-5xl mb-4">🎧</p>
          <p className="text-lg">{locale === 'zh' ? '该范围暂无文章' : 'No articles found'}</p>
        </div>
      )}

      {bannerType && (
        <TrialBanner type={bannerType} onClose={() => setBannerType(null)} />
      )}

      {/* Start button */}
      <button
        onClick={() => {
          setStarted(true)
        }}
        className="w-full py-3 rounded-xl text-base font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-sm transition-all"
      >
        {locale === 'zh' ? `🎧 开始听力 (${sessionArticles.length}篇)` : `🎧 Start Listening (${sessionArticles.length} articles)`}
      </button>
    </div>
  )
}
