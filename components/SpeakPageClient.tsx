'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import type { Level, Article } from '@/lib/types'
import { useCustomArticles } from '@/lib/use-custom-articles'
import SpeakSession from './SpeakSession'
import { useAuth } from '@/lib/auth-context'
import TrialBanner from './TrialBanner'

interface SpeakPageClientProps {
  levels: Level[]
  articles: Article[]
}

export default function SpeakPageClient({ levels, articles: baseArticles }: SpeakPageClientProps) {
  const { t, locale } = useTranslation()
  const { user, loading } = useAuth()
  const articles = useCustomArticles(baseArticles)
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null)
  const [artPage, setArtPage] = useState(0)
  const [started, setStarted] = useState(false)
  const [bannerType, setBannerType] = useState<'register' | 'verify' | null>(null)

  // Display: level-filtered only
  const displayArticles = selectedLevelId !== null
    ? articles.filter((a) => a.level === selectedLevelId)
    : articles
  // Session uses all articles from the selected level
  const sessionArticles = displayArticles

  useEffect(() => { setStarted(false) }, [selectedLevelId])

  // 加载中
  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>
  }

  if (started) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => setStarted(false)}
          className="mb-4 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          ← {locale === 'zh' ? '返回选文' : 'Back to articles'}
        </button>
        <SpeakSession key={selectedLevelId ?? 'all'} articles={sessionArticles} />
      </div>
    )
  }

  const lvlColors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4']

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">🗣️ {locale === 'zh' ? '口语练习' : 'Speaking Practice'}</h1>
        <p className="text-gray-400 text-sm">{locale === 'zh' ? '选择文章范围，看中文开口说' : 'Select articles, read and speak aloud'}</p>
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
          <button key={l.id} onClick={() => setSelectedLevelId(selectedLevelId === l.id ? null : l.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              selectedLevelId === l.id ? 'text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
            style={selectedLevelId === l.id ? { backgroundColor: l.color } : undefined}>
            {l.emoji} {t(`level.${l.id}.name`)}
          </button>
        ))}
      </div>

      {selectedLevelId !== null && (
        <div className="mb-6 bg-gray-50 rounded-xl px-5 py-3">
          <p className="text-sm text-gray-500">{t(`level.${selectedLevelId}.desc`)}</p>
        </div>
      )}

      {/* Article cards */}
      {displayArticles.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🗣️</p>
          <p className="text-lg">{locale === 'zh' ? '暂无文章' : 'No articles'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {displayArticles.slice(artPage * 4, (artPage + 1) * 4).map((article) => {
            const preview = article.paragraphs[0]?.text.slice(0, 60) || ''
            return (
              <div key={article.id}
                className="block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-1.5" style={{ backgroundColor: article.level ? lvlColors[article.level - 1] : '#999' }} />
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-2xl shrink-0">{article.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-gray-800 leading-tight">{article.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{article.titleEn}</p>
                    </div>
                  </div>
                  {preview && (
                    <p className="text-xs text-gray-400 line-clamp-2 mb-2 leading-relaxed">{preview}{preview.length >= 60 && '...'}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: article.level ? lvlColors[article.level - 1] : '#999' }}>L{article.level}</span>
                    <span className="text-xs text-gray-400">📝 {article.vocabulary.length}</span>
                  </div>
                </div>
              </div>
            )
          })}
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

      {bannerType && (
        <TrialBanner type={bannerType} onClose={() => setBannerType(null)} />
      )}

            <button onClick={() => {
          setStarted(true)
        }}
        className="w-full py-3 rounded-xl text-base font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 shadow-sm transition-all">
        {locale === 'zh' ? `🗣️ 开始口语 (${sessionArticles.length}篇)` : `🗣️ Start Speaking (${sessionArticles.length} articles)`}
      </button>
    </div>
  )
}
