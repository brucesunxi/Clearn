import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getArticle, getLevel, getAllArticles } from '@/lib/content'
import ArticlePageClient from '@/components/ArticlePageClient'

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
    alternates: {
      canonical: canonicalUrl,
    },
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
    <ArticlePageClient article={article} level={level} />
  )
}
