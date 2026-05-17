'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'
import { AdBanner } from '@/lib/adsense'
import type { Level, Article } from '@/lib/types'

interface HomePageClientProps {
  levels: Level[]
  recentArticles: Article[]
}

export default function HomePageClient({ levels, recentArticles }: HomePageClientProps) {
  const { t } = useTranslation()

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Hero section */}
      <section className="text-center py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          {t('home.hero.title')} <span className="text-4xl">🎉</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
          {t('home.hero.subtitle')}
        </p>
        <Link
          href="/reading"
          className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
        >
          {t('home.hero.cta')} 📚
        </Link>
      </section>

      <AdBanner />

      {/* Levels section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {t('home.levels.title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {levels.map((level) => (
            <LevelCardInline key={level.id} level={level} t={t} />
          ))}
        </div>
      </section>

      <AdBanner />

      {/* Recent articles */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{t('home.recent.title')}</h2>
          <Link
            href="/reading"
            className="text-orange-500 hover:text-orange-600 font-medium text-sm"
          >
            {t('home.recent.viewAll')} →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recentArticles.map((article) => (
            <ArticleCardInline key={article.id} article={article} t={t} />
          ))}
        </div>
      </section>
    </div>
  )
}

function LevelCardInline({ level, t }: { level: Level; t: (key: string) => string }) {
  return (
    <Link
      href={`/reading?level=${level.id}`}
      className="block rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      style={{ backgroundColor: level.color + '18' }}
    >
      <div className="text-4xl mb-3">{level.emoji}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-1">
        {t(`level.${level.id}.name`)}
      </h3>
      <p className="text-sm text-gray-500 mb-2">{level.ageRange}</p>
      <p className="text-sm text-gray-600 leading-relaxed">
        {t(`level.${level.id}.desc`)}
      </p>
      <div
        className="mt-3 inline-block text-xs font-medium px-3 py-1 rounded-full text-white"
        style={{ backgroundColor: level.color }}
      >
        {level.charCount}
      </div>
    </Link>
  )
}

function ArticleCardInline({ article, t }: { article: Article; t: (key: string) => string }) {
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
            <span
              className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
              style={{ backgroundColor: '#999' }}
            >
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
