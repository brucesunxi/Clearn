import { getLevels, getAllArticles } from '@/lib/content'
import LearnPageClient from '@/components/LearnPageClient'

export default function LearnPage() {
  const levels = getLevels()
  const articles = getAllArticles()
  return <LearnPageClient levels={levels} articles={articles} />
}
