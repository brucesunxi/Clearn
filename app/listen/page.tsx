import type { Metadata } from 'next'
import { getAllArticles } from '@/lib/content'
import ListenSession from '@/components/ClientListenSession'

export const metadata: Metadata = {
  title: '听力 Listening',
  description: '中文听力练习，听中文选择正确意思，提升中文听力理解能力。Chinese listening practice for overseas children.',
  openGraph: {
    title: '听力 - 熊猫汉语',
    description: '中文听力练习，听中文选择正确意思，提升中文听力理解能力。',
  },
}

export default function ListenPage() {
  const articles = getAllArticles()
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <ListenSession articles={articles} />
    </div>
  )
}
