import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getArticle, getLevel, getAllArticles } from '@/lib/content'
import ArticleContent from '@/components/ArticleContent'
import WordList from '@/components/WordList'
import { AdBanner } from '@/lib/adsense'

interface ArticlePageProps {
  params: { id: string }
}

export function generateStaticParams() {
  const articles = getAllArticles()
  return articles.map((a) => ({ id: a.id }))
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const article = getArticle(params.id)
  if (!article) notFound()

  const level = getLevel(article.level)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href={`/reading?level=${article.level}`}
          className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
        >
          ← {level?.emoji} {level?.name}
        </Link>
      </div>

      {/* Main content */}
      <ArticleContent article={article} />

      <AdBanner />

      {/* Vocabulary list */}
      <WordList vocabulary={article.vocabulary} />

      {/* Learn this lesson's words */}
      <div className="mt-8 text-center">
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors shadow-sm"
        >
          📝 学这些单词
        </Link>
      </div>
    </div>
  )
}
