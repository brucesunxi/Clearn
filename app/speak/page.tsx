import { getAllArticles } from '@/lib/content'
import SpeakSession from '@/components/SpeakSession'

export default function SpeakPage() {
  const articles = getAllArticles()
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <SpeakSession articles={articles} />
    </div>
  )
}
