import Link from 'next/link'
import { getLevels, getLevel, getArticlesByLevel, getAllArticles } from '@/lib/content'
import ArticleCard from '@/components/ArticleCard'
import { AdBanner } from '@/lib/adsense'

interface ReadingPageProps {
  searchParams: { level?: string }
}

export default function ReadingPage({ searchParams }: ReadingPageProps) {
  const { level } = searchParams
  const levels = getLevels()
  const selectedLevelId = level ? parseInt(level) : null

  const articles = selectedLevelId
    ? getArticlesByLevel(selectedLevelId)
    : getAllArticles()

  const selectedLevel = selectedLevelId ? getLevel(selectedLevelId) : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">阅读</h1>
      <p className="text-gray-400 mb-8">
        选择感兴趣的文章，开始阅读吧！
      </p>

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
          全部
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
            style={
              selectedLevelId === l.id
                ? { backgroundColor: l.color }
                : undefined
            }
          >
            {l.emoji} {l.name}
          </Link>
        ))}
      </div>

      {/* Section header for selected level */}
      {selectedLevel && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {selectedLevel.emoji} {selectedLevel.name}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {selectedLevel.description}
          </p>
        </div>
      )}

      {/* Article grid */}
      {articles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-4">📝</p>
          <p>这个级别还没有文章，敬请期待！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      <AdBanner />
    </div>
  )
}
