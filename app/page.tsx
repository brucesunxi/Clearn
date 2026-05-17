import { getLevels, getAllArticles } from '@/lib/content'
import HomePageClient from '@/components/HomePageClient'

export default function HomePage() {
  const levels = getLevels()
  const allArticles = getAllArticles()
  const recentArticles = allArticles.slice(-4).reverse()

  return <HomePageClient levels={levels} recentArticles={recentArticles} />
}
