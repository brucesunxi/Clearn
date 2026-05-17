import { getAllArticles } from '@/lib/content'
import CheckInCalendar from '@/components/CheckInCalendar'
import FlashcardSession from '@/components/FlashcardSession'

export default function LearnPage() {
  const articles = getAllArticles()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">学习中心</h1>
      <p className="text-gray-400 mb-8">每天学一点，中文越来越好！</p>

      {/* Check-in calendar */}
      <div className="mb-8">
        <CheckInCalendar />
      </div>

      {/* Flashcard session */}
      <FlashcardSession articles={articles} />
    </div>
  )
}
