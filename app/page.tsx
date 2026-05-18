import { getAllArticles } from '@/lib/content'
import HomePageClient from '@/components/HomePageClient'

export default function HomePage() {
  const allArticles = getAllArticles()
  return <HomePageClient totalArticles={allArticles.length} />
}
