import type { Metadata } from 'next'
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

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = getArticle(params.id)
  const canonicalUrl = `https://pandahan.xyz/reading/${params.id}`;
  if (!article) {
    return { title: '文章未找到 Article Not Found' }
  }
  return {
    title: `${article.title} ${article.titleEn}`,
    description: `阅读中文文章「${article.title}」(${article.titleEn})，学习${article.vocabulary.length}个生词。Read Chinese: ${article.titleEn}.`,
    openGraph: {
      title: `${article.title} - 熊猫汉语`,
      description: `阅读「${article.title}」- ${article.titleEn}，适合海外华裔儿童的中文分级阅读。`,
    },
  }
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
      <WordList vocabulary={article.vocabulary} articleId={article.id} />

      {/* Learn this lesson's words */}
      <div className="mt-8 text-center">
        <ArticleStudyButton />
      </div>
    </div>
  )
}
