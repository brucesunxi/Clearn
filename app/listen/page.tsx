import { getAllArticles } from '@/lib/content'
import ListenSession from '@/components/ListenSession'

export default function ListenPage() {
  const articles = getAllArticles()
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <ListenSession articles={articles} />
    </div>
  )
}
