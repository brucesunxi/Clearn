import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getArticle, getLevel, getAllArticles } from '@/lib/content'
import ArticlePageClient from '@/components/ArticlePageClient'
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd'

interface ArticlePageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = getArticle(params.id)
  const canonicalUrl = `https://pandahan.xyz/reading/${params.id}`;
  if (!article) {
    return {
      title: 'Article Not Found 文章未找到',
      robots: { index: false, follow: false },
    }
  }

  const level = getLevel(article.level)
  const keywords = [
    'Chinese reading', 'learn Chinese', 'Chinese article',
    '中文阅读', '学中文', '中文学习',
    article.title,
    article.titleEn,
    `HSK ${article.level}`,
    'overseas Chinese', 'kids Chinese',
    '海外华裔', '儿童中文',
    ...article.vocabulary.slice(0, 10).map(v => v.word),
    ...article.vocabulary.slice(0, 10).map(v => v.meaning),
  ]

  return {
    title: `${article.titleEn} ${article.title} - Chinese Reading`,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en-US': canonicalUrl,
        'zh-CN': canonicalUrl,
      },
    },
    description: `Read Chinese: ${article.titleEn}. Learn ${article.vocabulary.length} new words. Level ${article.level}. 阅读中文文章「${article.title}」，学习${article.vocabulary.length}个生词。${level?.name ? `适合${level.name}水平。` : ''}`,
    keywords: keywords.join(', '),
    openGraph: {
      title: `${article.titleEn} ${article.title} - PandaHan`,
      description: `Read ${article.titleEn}. ${article.vocabulary.length} words to learn. Perfect for overseas children learning Chinese. 阅读「${article.title}」，适合海外华裔儿童的中文分级阅读。`,
      type: 'article',
      authors: ['PandaHan'],
      publishedTime: new Date().toISOString(),
      section: level?.name || 'Chinese Reading 中文阅读',
      tags: ['Chinese learning', 'leveled reading', 'overseas Chinese', '中文学习', '分级阅读', '海外华裔', ...article.vocabulary.slice(0, 5).map(v => v.word)],
      locale: 'zh_CN',
      alternateLocale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${article.titleEn} ${article.title} - PandaHan`,
      description: `Read ${article.titleEn}. Perfect for children learning Chinese. 阅读「${article.title}」，适合海外华裔儿童的中文分级阅读。`,
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
  const canonicalUrl = `https://pandahan.xyz/reading/${params.id}`;

  return (
    <>
      <ArticleJsonLd
        title={article.title}
        description={`阅读中文文章「${article.title}」(${article.titleEn})，学习${article.vocabulary.length}个生词。`}
        url={canonicalUrl}
        keywords={[...article.vocabulary.slice(0, 10).map(v => v.word), '中文学习', '分级阅读']}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://pandahan.xyz/' },
          { name: 'Reading', url: 'https://pandahan.xyz/reading' },
          { name: article.titleEn || article.title, url: canonicalUrl },
        ]}
      />
      <ArticlePageClient article={article} level={level} />
    </>
  )
}
