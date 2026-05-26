import type { Metadata } from 'next'
import { getLevels, getLevel, getArticlesByLevel, getAllArticles } from '@/lib/content'
import ReadingPageClient from '@/components/ReadingPageClient'
import { AdBanner } from '@/lib/adsense'

export const metadata: Metadata = {
  title: '阅读 Reading',
  alternates: {
    canonical: 'https://pandahan.xyz/reading',
  },
  description: '中文分级阅读文章，从启蒙到高级，适合不同年龄段的海外华裔儿童。Leveled Chinese reading articles for overseas children.',
  openGraph: {
    title: '阅读 - 熊猫汉语',
    description: '中文分级阅读文章，从启蒙到高级，适合不同年龄段的海外华裔儿童。',
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <ReadingPageClient
        levels={levels}
        articles={articles}
        selectedLevelId={selectedLevelId}
        selectedLevel={selectedLevel || undefined}
      />
      <AdBanner />
    </div>
  )
}
