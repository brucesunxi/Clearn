import type { Metadata } from 'next'
import { getAllArticles } from '@/lib/content'
import SpeakSession from '@/components/ClientSpeakSession'

export const metadata: Metadata = {
  title: '口语 Speaking',
  description: '中文口语练习，看中文开口说，提升中文发音和口语表达能力。Chinese speaking practice with pronunciation feedback.',
  openGraph: {
    title: '口语 - 熊猫汉语',
    description: '中文口语练习，看中文开口说，提升中文发音和口语表达能力。',
  },
}

export default function SpeakPage() {
  const articles = getAllArticles()
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <SpeakSession articles={articles} />
    </div>
  )
}
