import { getAllArticles } from '@/lib/content'
import ListenSpeakPageClient from '@/components/ListenSpeakPageClient'

export default function PracticePage() {
  const articles = getAllArticles()
  return <ListenSpeakPageClient articles={articles} />
}
