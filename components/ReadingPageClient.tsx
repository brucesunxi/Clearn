'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'
import type { Level, Article } from '@/lib/types'
import { getMasteredCount, getTotalWordsCount } from '@/lib/words'

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

  useEffect(() => {
    setMastered(getMasteredCount())
    setTotalWords(getTotalWordsCount())
  }, [])

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('reading.title')}</h1>
      <p className="text-gray-400 mb-4">{t('reading.subtitle')}</p>

      {/* Stats bar */}
      <div className="flex gap-3 mb-6">
        <div className="bg-sky-50 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-lg">📖</span>
          <div>
            <div className="text-sm font-bold text-sky-600">{articles.length}</div>
            <div className="text-[10px] text-sky-400">{locale === 'zh' ? '文章' : 'Articles'}</div>
          </div>
        </div>
        <div className="bg-emerald-50 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-lg">📝</span>
          <div>
            <div className="text-sm font-bold text-emerald-600">{totalWords}</div>
            <div className="text-[10px] text-emerald-400">{locale === 'zh' ? '已学单词' : 'Learned'}</div>
          </div>
        </div>
        <div className="bg-violet-50 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-lg">✅</span>
          <div>
            <div className="text-sm font-bold text-violet-600">{mastered}</div>
            <div className="text-[10px] text-violet-400">{locale === 'zh' ? '已掌握' : 'Mastered'}</div>
          </div>
        </div>
      </div>

      {/* Level filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/reading"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !selectedLevelId
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('reading.all')}
        </Link>
        {levels.map((l) => (
          <Link
            key={l.id}
            href={`/reading?level=${l.id}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedLevelId === l.id
                ? 'text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={selectedLevelId === l.id ? { backgroundColor: l.color } : undefined}
          >
            {l.emoji} {t(`level.${l.id}.name`)}
          </Link>
        ))}
      </div>

      {/* Selected level header */}
      {selectedLevel && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {selectedLevel.emoji} {t(`level.${selectedLevel.id}.name`)}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{t(`level.${selectedLevel.id}.desc`)}</p>
        </div>
      )}

      {/* Article list */}
      {articles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-4">📝</p>
          <p>{t('reading.noArticles')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {articles.map((article) => (
            <ArticleCardClient key={article.id} article={article} t={t} />
          ))}
        </div>
      )}
    </>
  )
}

function ArticleCardClient({
  article,
  t,
}: {
  article: Article
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  return (
    <Link
      href={`/reading/${article.id}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{article.emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-800 truncate">{article.title}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{article.titleEn}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium bg-gray-400">
              {t(`level.${article.level}.name`)}
            </span>
            <span className="text-xs text-gray-400">
              {article.vocabulary.length} {t('reading.newWords')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
