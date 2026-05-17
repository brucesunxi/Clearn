import { getLevels, getLevel, getArticlesByLevel, getAllArticles } from '@/lib/content'
import ReadingPageClient from '@/components/ReadingPageClient'
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
