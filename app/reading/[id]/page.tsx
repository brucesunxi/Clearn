import { notFound } from 'next/navigation'
import { getArticle, getLevel, getAllArticles } from '@/lib/content'
import ArticleContent from '@/components/ArticleContent'
import WordList from '@/components/WordList'
import ArticleBreadcrumb from '@/components/ArticleBreadcrumb'
import ArticleStudyButton from '@/components/ArticleStudyButton'
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
      <ArticleBreadcrumb level={level || undefined} articleLevel={article.level} />

      {/* Main content */}
      <ArticleContent article={article} />

      <AdBanner />

      {/* Vocabulary list */}
      <WordList vocabulary={article.vocabulary} />

      {/* Learn this lesson's words */}
      <div className="mt-8 text-center">
        <ArticleStudyButton />
      </div>
    </div>
  )
}
