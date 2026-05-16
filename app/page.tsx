import Link from 'next/link'
import { getLevels, getAllArticles, getLevel } from '@/lib/content'
import LevelCard from '@/components/LevelCard'
import ArticleCard from '@/components/ArticleCard'

export default function HomePage() {
  const levels = getLevels()
  const allArticles = getAllArticles()
  const recentArticles = allArticles.slice(-4).reverse()

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Hero section */}
      <section className="text-center py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          中文，可以很有趣！<span className="text-4xl">🎉</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
          专为海外华裔儿童设计的中文分级阅读平台。
          <br />
          从简单到复杂，让孩子在阅读中爱上中文。
        </p>
        <Link
          href="/reading"
          className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
        >
          开始阅读 📚
        </Link>
      </section>

      {/* Levels section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          选择你的级别
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {levels.map((level) => (
            <LevelCard key={level.id} level={level} />
          ))}
        </div>
      </section>

      {/* Recent articles */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">最新文章</h2>
          <Link
            href="/reading"
            className="text-orange-500 hover:text-orange-600 font-medium text-sm"
          >
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recentArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>
    </div>
  )
}
