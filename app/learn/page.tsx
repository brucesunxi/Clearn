import { getAllArticles } from '@/lib/content'
import LearnPageClient from '@/components/LearnPageClient'

export default function LearnPage() {
  const articles = getAllArticles()
  return <LearnPageClient articles={articles} />
}
