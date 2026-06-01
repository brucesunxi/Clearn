'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import type { Level, Article } from '@/lib/types'
import { useCustomArticles } from '@/lib/use-custom-articles'
import ListenSession from './ListenSession'
import SpeakSession from './SpeakSession'
import IntensiveListening from './IntensiveListening'
import { useAuth } from '@/lib/auth-context'
import AuthWall from './AuthWall'

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
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([])
  const [artPage, setArtPage] = useState(0)

  // Display: level-filtered only (always show all articles in the grid)
  const displayArticles = selectedLevelId !== null
    ? articles.filter((a) => a.level === selectedLevelId)
    : articles
  // Session: use selected articles, or all if none selected
  const sessionArticles = selectedArticleIds.length > 0
    ? articles.filter((a) => selectedArticleIds.includes(a.id))
    : displayArticles

  const lvlColors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4']

  // 登录检查
  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            🎧 {t('listenspeak.title', '听力口语练习')}
          </h1>
          <p className="text-sm text-gray-400">
            {locale === 'zh' ? '听力和口语练习，提升中文听说能力' : 'Practice listening and speaking Chinese'}
          </p>
        </div>
        <AuthWall
          featureName="听力口语练习"
          description="听力口语练习需要登录账号。注册即送 500 金币开始学习！"
        />
      </div>
    )
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
        <button onClick={() => { setSelectedLevelId(null); setSelectedArticleIds([]); setArtPage(0) }}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            selectedLevelId === null && selectedArticleIds.length === 0
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

      {/* Article cards grid (collapsible) */}
      <div className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
          {displayArticles.slice(artPage * 8, (artPage + 1) * 8).map((article) => {
            const selected = selectedArticleIds.includes(article.id)
            return (
              <button key={article.id} onClick={() => {
                setSelectedArticleIds((prev) =>
                  prev.includes(article.id) ? prev.filter((id) => id !== article.id) : prev.length >= 3 ? prev : [...prev, article.id]
                )
              }}
                className={`group text-left bg-white rounded-xl border shadow-sm transition-all overflow-hidden ${
                  selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-100 hover:border-blue-200'
                }`}>
                <div className="h-1" style={{ backgroundColor: article.level ? lvlColors[article.level - 1] : '#999' }} />
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg shrink-0">{article.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-800 leading-tight truncate">{article.title}</p>
                      <p className="text-[10px] text-gray-400 truncate">{article.titleEn}</p>
                    </div>
                    <span className="text-xs">{selected ? '✅' : '☐'}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        {selectedArticleIds.length > 0 && (
          <p className="mt-2 text-xs text-blue-600 font-medium">
            {locale === 'zh' ? `已选 ${selectedArticleIds.length}/3 篇` : `${selectedArticleIds.length}/3 selected`}
          </p>
        )}
      </div>

{Math.ceil(displayArticles.length / 8) > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 mb-2">
          <button onClick={() => setArtPage((p) => Math.max(0, p - 1))} disabled={artPage === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            ← {locale === 'zh' ? '上一页' : 'Prev'}
          </button>
          <span className="text-xs text-gray-400">{artPage + 1} / {Math.ceil(displayArticles.length / 8)}</span>
          <button onClick={() => setArtPage((p) => Math.min(Math.ceil(displayArticles.length / 8) - 1, p + 1))} disabled={artPage >= Math.ceil(displayArticles.length / 8) - 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            {locale === 'zh' ? '下一页' : 'Next'} →
          </button>
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

      {/* Content */}
      {tab === 'listen' && <ListenSession key={selectedArticleIds.join(',') || 'all'} articles={sessionArticles} />}
      {tab === 'intensive' && <IntensiveListening articles={sessionArticles} />}
      {tab === 'speak' && <SpeakSession articles={sessionArticles} />}
    </div>
  )
}
