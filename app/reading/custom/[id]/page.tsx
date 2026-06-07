import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCustomArticleServer } from '@/lib/custom-articles-server'
import CustomArticlePageClient from '@/components/CustomArticlePageClient'

interface CustomArticlePageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: CustomArticlePageProps): Promise<Metadata> {
  const article = getCustomArticleServer(params.id)
  const canonicalUrl = `https://pandahan.xyz/reading/custom/${params.id}`;

  if (!article) {
    return {
      title: '文章未找到 Article Not Found',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `${article.title} ${article.titleEn}`,
    alternates: {
      canonical: canonicalUrl,
    },
    description: `阅读导入的中文文章「${article.title}」(${article.titleEn})，学习${article.vocabulary.length}个生词。Read imported Chinese: ${article.titleEn}.`,
    openGraph: {
      title: `${article.title} - PandaHan`,
      description: `阅读导入文章「${article.title}」- ${article.titleEn}，适合海外华裔儿童的中文分级阅读。`,
    },
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default function CustomArticlePage({ params }: CustomArticlePageProps) {
  const article = getCustomArticleServer(params.id)
  if (!article) notFound()

  return <CustomArticlePageClient />
}
