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
  const [startedArticle, setStartedArticle] = useState<Article | null>(null)
  const [artPage, setArtPage] = useState(0)

  const displayArticles = selectedLevelId !== null
    ? articles.filter((a) => a.level === selectedLevelId)
    : articles

  const [bannerType, setBannerType] = useState<'register' | 'verify' | null>(null)

  // 登录检查
  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>
  }

  if (startedArticle) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => setStartedArticle(null)}
          className="mb-4 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          ← {locale === 'zh' ? '返回选文' : 'Back to articles'}
        </button>
        {tab === 'listen' ? (
          <ListenSession key={startedArticle.id} articles={[startedArticle]} />
        ) : tab === 'intensive' ? (
          <IntensiveListening key={startedArticle.id} articles={[startedArticle]} />
        ) : (
          <SpeakSession key={startedArticle.id} articles={[startedArticle]} />
        )}
      </div>
    )
  }

  const lvlColors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4']

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          🎧 {t('listenspeak.title')}
        </h1>
        <p className="text-sm text-gray-400">
          {locale === 'zh' ? '选择文章开始练习' : 'Pick an article to practice'}
        </p>
      </div>

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

      {/* Level tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setSelectedLevelId(null); setArtPage(0) }}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            selectedLevelId === null
              ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
          }`}>
          🌐 {locale === 'zh' ? '全部文章' : 'All Articles'}
        </button>
        {levels.map((l) => (
          <button key={l.id} onClick={() => { setSelectedLevelId(selectedLevelId === l.id ? null : l.id); setArtPage(0) }}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              selectedLevelId === l.id ? 'text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
            style={selectedLevelId === l.id ? { backgroundColor: l.color } : undefined}>
            {l.emoji} {t(`level.${l.id}.name`)}
          </button>
        ))}
      </div>

      {/* Article cards */}
      {displayArticles.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🎧</p>
          <p className="text-lg">{locale === 'zh' ? '暂无文章' : 'No articles'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayArticles.slice(artPage * 4, (artPage + 1) * 4).map((article) => (
            <button key={article.id} onClick={() => setStartedArticle(article)}
              className="group text-left bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden">
              <div className="h-1" style={{ backgroundColor: article.level ? lvlColors[article.level - 1] : '#999' }} />
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg shrink-0">{article.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-800 leading-tight truncate">{article.title}</p>
                    <p className="text-[10px] text-gray-400 truncate">{article.titleEn}</p>
                  </div>
                  <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">{locale === 'zh' ? '开始' : 'Go'}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {Math.ceil(displayArticles.length / 4) > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 mb-2">
          <button onClick={() => setArtPage((p) => Math.max(0, p - 1))} disabled={artPage === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            ← {locale === 'zh' ? '上一页' : 'Prev'}
          </button>
          <span className="text-xs text-gray-400">{artPage + 1} / {Math.ceil(displayArticles.length / 4)}</span>
          <button onClick={() => setArtPage((p) => Math.min(Math.ceil(displayArticles.length / 4) - 1, p + 1))} disabled={artPage >= Math.ceil(displayArticles.length / 4) - 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            {locale === 'zh' ? '下一页' : 'Next'} →
          </button>
        </div>
      )}

      {/* 引导条 */}
      {bannerType && (
        <TrialBanner type={bannerType} onClose={() => setBannerType(null)} />
      )}
    </div>
  )
}
