import type { Metadata } from 'next'
import { getLevels, getLevel, getArticlesByLevel, getAllArticles } from '@/lib/content'
import ReadingPageClient from '@/components/ReadingPageClient'
import { AdBanner } from '@/lib/adsense'
import { WebPageJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'Reading 阅读 - Leveled Chinese Articles 分级阅读',
  alternates: {
    canonical: 'https://pandahan.xyz/reading',
    languages: {
      'en-US': 'https://pandahan.xyz/reading',
      'zh-CN': 'https://pandahan.xyz/reading',
    },
  },
  description: 'Leveled Chinese reading articles from beginner to advanced. Perfect for overseas children learning Chinese. 中文分级阅读文章，从启蒙到高级，适合不同年龄段的海外华裔儿童。',
  keywords: ['Chinese reading', 'leveled reading', 'learn Chinese', '中文阅读', '分级阅读', '学中文'],
  openGraph: {
    title: 'Reading 阅读 - PandaHan',
    description: 'Leveled Chinese reading articles from beginner to advanced. 中文分级阅读文章，从启蒙到高级。',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
  },
}

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
    <>
      <WebPageJsonLd
        title="Reading 阅读 - Leveled Chinese Articles"
        description="Leveled Chinese reading articles from beginner to advanced. Perfect for overseas children learning Chinese."
        url="https://pandahan.xyz/reading"
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://pandahan.xyz/' },
          { name: 'Reading', url: 'https://pandahan.xyz/reading' },
        ]}
      />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <ReadingPageClient
          levels={levels}
          articles={articles}
          selectedLevelId={selectedLevelId}
          selectedLevel={selectedLevel || undefined}
        />
        <AdBanner />
      </div>
    </>
  )
}
