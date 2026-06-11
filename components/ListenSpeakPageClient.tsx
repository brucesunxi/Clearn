'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import type { Level, Article } from '@/lib/types'
import { useCustomArticles } from '@/lib/use-custom-articles'
import ListenSession from './ListenSession'
import SpeakSession from './SpeakSession'
import IntensiveListening from './IntensiveListening'
import { useAuth } from '@/lib/auth-context'
import TrialBanner from './TrialBanner'

interface ListenSpeakPageClientProps {
  levels: Level[]
  articles: Article[]
}

type Tab = 'listen' | 'speak' | 'intensive'

export default function ListenSpeakPageClient({ levels, articles: baseArticles }: ListenSpeakPageClientProps) {
  const { t, locale } = useTranslation()
  const { user, loading } = useAuth()
  const articles = useCustomArticles(baseArticles)
  const [tab, setTab] = useState<Tab>('listen')
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null)

  // Display: level-filtered only
  const displayArticles = selectedLevelId !== null
    ? articles.filter((a) => a.level === selectedLevelId)
    : articles
  // Session uses all articles from the selected level (no individual selection)
  const sessionArticles = displayArticles

  const [bannerType, setBannerType] = useState<'register' | 'verify' | null>(null)

  // 登录检查
  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>
  }

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

      {/* Level tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setSelectedLevelId(null) }}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            selectedLevelId === null
              ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
          }`}>
          🌐 {locale === 'zh' ? '全部文章' : 'All Articles'}
        </button>
        {levels.map((l) => (
          <button key={l.id} onClick={() => setSelectedLevelId(selectedLevelId === l.id ? null : l.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              selectedLevelId === l.id ? 'text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
            style={selectedLevelId === l.id ? { backgroundColor: l.color } : undefined}>
            {l.emoji} {t(`level.${l.id}.name`)}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      {displayArticles.length > 0 ? (
        <div className="mb-6 flex items-center gap-4 text-sm text-gray-500 justify-center">
          <span>📚 {displayArticles.length} {locale === 'zh' ? '篇文章' : 'articles'}</span>
          <span className="text-gray-300">·</span>
          <span>📝 {displayArticles.reduce((s, a) => s + a.vocabulary.length, 0)} {locale === 'zh' ? '个单词' : 'words'}</span>
        </div>
      ) : (
        <div className="mb-6 text-center py-12 text-gray-400">
          <p className="text-5xl mb-4">🎧</p>
          <p className="text-lg">{locale === 'zh' ? '暂无文章' : 'No articles'}</p>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('listen')}
          className={`flex-1 py-3 rounded-xl text-base font-medium transition-all ${
            tab === 'listen' ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}>
          🎧 {locale === 'zh' ? '选意思' : 'Quiz'}
        </button>
        <button onClick={() => setTab('intensive')}
          className={`flex-1 py-3 rounded-xl text-base font-medium transition-all ${
            tab === 'intensive' ? 'bg-indigo-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}>
          🎯 {locale === 'zh' ? '精听' : 'Intensive'}
        </button>
        <button onClick={() => setTab('speak')}
          className={`flex-1 py-3 rounded-xl text-base font-medium transition-all ${
            tab === 'speak' ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}>
          🗣️ {t('listenspeak.speak')}
        </button>
      </div>

      {/* 引导条 */}
      {bannerType && (
        <TrialBanner type={bannerType} onClose={() => setBannerType(null)} />
      )}

      {/* Content */}
      {tab === 'listen' ? (
        <ListenSession key={selectedLevelId ?? 'all'} articles={sessionArticles} />
      ) : tab === 'intensive' ? (
        <IntensiveListening key={selectedLevelId ?? 'all'} articles={sessionArticles} />
      ) : (
        <SpeakSession key={selectedLevelId ?? 'all'} articles={sessionArticles} />
      )}
    </div>
  )
}
