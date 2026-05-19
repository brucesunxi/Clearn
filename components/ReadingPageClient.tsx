'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'
import type { Level, Article } from '@/lib/types'
import { getMasteredCount, getTotalWordsCount } from '@/lib/words'
import { getCustomArticles } from '@/lib/custom-articles'

interface ReadingPageClientProps {
  levels: Level[]
  articles: Article[]
  selectedLevelId: number | null
  selectedLevel: Level | undefined
}

export default function ReadingPageClient({
  levels,
  articles,
  selectedLevelId,
  selectedLevel,
}: ReadingPageClientProps) {
  const { t, locale } = useTranslation()
  const [mastered, setMastered] = useState(0)
  const [totalWords, setTotalWords] = useState(0)
  const [customArticles, setCustomArticles] = useState<Article[]>([])

  useEffect(() => {
    setMastered(getMasteredCount())
    setTotalWords(getTotalWordsCount())
    setCustomArticles(getCustomArticles())
  }, [])

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">📖 {t('reading.title')}</h1>
        <p className="text-gray-400 text-sm">{t('reading.subtitle')}</p>
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 mb-6">
        <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 rounded-xl px-4 py-2.5 flex items-center gap-2 flex-1">
          <span className="text-xl">📚</span>
          <div>
            <div className="text-lg font-bold text-sky-700">{articles.length}</div>
            <div className="text-[10px] text-sky-500 font-medium">{locale === 'zh' ? '文章' : 'Articles'}</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl px-4 py-2.5 flex items-center gap-2 flex-1">
          <span className="text-xl">📝</span>
          <div>
            <div className="text-lg font-bold text-emerald-700">{totalWords}</div>
            <div className="text-[10px] text-emerald-500 font-medium">{locale === 'zh' ? '已学单词' : 'Learned'}</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-xl px-4 py-2.5 flex items-center gap-2 flex-1">
          <span className="text-xl">✅</span>
          <div>
            <div className="text-lg font-bold text-violet-700">{mastered}</div>
            <div className="text-[10px] text-violet-500 font-medium">{locale === 'zh' ? '已掌握' : 'Mastered'}</div>
          </div>
        </div>
      </div>

      {/* Level filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/reading"
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            !selectedLevelId
              ? 'bg-gray-800 text-white shadow-sm'
              : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          🌐 {t('reading.all')}
        </Link>
        {levels.map((l) => (
          <Link
            key={l.id}
            href={`/reading?level=${l.id}`}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              selectedLevelId === l.id
                ? 'text-white shadow-sm'
                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
            style={selectedLevelId === l.id ? { backgroundColor: l.color } : undefined}
          >
            {l.emoji} {t(`level.${l.id}.name`)}
          </Link>
        ))}
      </div>

      {/* Selected level description */}
      {selectedLevel && (
        <div className="mb-6 bg-gray-50 rounded-xl px-5 py-3">
          <p className="text-sm text-gray-500">{t(`level.${selectedLevel.id}.desc`)}</p>
        </div>
      )}

      {/* Article list */}
      {articles.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">📝</p>
          <p className="text-lg">{t('reading.noArticles')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {articles.map((article) => (
            <ArticleCardClient key={article.id} article={article} locale={locale} t={t} />
          ))}
        </div>
      )}

      {/* Custom articles from imports */}
      {customArticles.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📥 {locale === 'zh' ? '我的导入' : 'My Imports'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {customArticles.map((article) => (
              <CustomArticleCard key={article.id} article={article} locale={locale} t={t} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function ArticleCardClient({
  article,
  locale,
  t,
}: {
  article: Article
  locale: string
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  // Get the first paragraph as a preview
  const preview = article.paragraphs[0]?.text.slice(0, 80) || ''

  return (
    <Link
      href={`/reading/${article.id}`}
      className="group block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* Top color bar */}
      <div
        className="h-1.5"
        style={{ backgroundColor: article.level ? levelsColor[article.level - 1] : '#999' }}
      />

      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl shrink-0">{article.emoji}</span>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-800 leading-tight">{article.title}</h3>
            <p className="text-sm text-gray-400 mt-0.5">{article.titleEn}</p>
          </div>
        </div>

        {/* Text preview */}
        <p className="text-sm text-gray-400 line-clamp-2 mb-3 leading-relaxed">
          {preview}
          {preview.length >= 80 && '...'}
        </p>

        {/* Tags row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs px-2.5 py-0.5 rounded-full text-white font-medium"
            style={{ backgroundColor: article.level ? levelsColor[article.level - 1] : '#999' }}
          >
            {t(`level.${article.level}.name`)}
          </span>
          <span className="text-xs text-gray-400">
            📝 {article.vocabulary.length} {t('reading.newWords')}
          </span>
          <span className="text-xs text-gray-400 ml-auto group-hover:text-orange-500 transition-colors">
            {locale === 'zh' ? '阅读 →' : 'Read →'}
          </span>
        </div>
      </div>
    </Link>
  )
}

function CustomArticleCard({
  article,
  locale,
  t,
}: {
  article: Article
  locale: string
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  const preview = article.paragraphs[0]?.text.slice(0, 80) || ''

  return (
    <Link
      href={`/reading/custom/${article.id}`}
      className="group block bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl shrink-0">{article.emoji}</span>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-800 leading-tight">{article.title}</h3>
            <p className="text-sm text-gray-400 mt-0.5">{article.titleEn}</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 line-clamp-2 mb-3 leading-relaxed">
          {preview}
          {preview.length >= 80 && '...'}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 font-medium">
            📥 {locale === 'zh' ? '已导入' : 'Imported'}
          </span>
          <span className="text-xs text-gray-400">
            📝 {article.vocabulary.length} {t('reading.newWords')}
          </span>
          <span className="text-xs text-gray-400 ml-auto group-hover:text-indigo-500 transition-colors">
            {locale === 'zh' ? '阅读 →' : 'Read →'}
          </span>
        </div>
      </div>
    </Link>
  )
}

const levelsColor = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
