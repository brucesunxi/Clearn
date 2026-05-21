import type { Metadata } from 'next'
import { AdBanner } from '@/lib/adsense'
import { getLevels, getAllArticles } from '@/lib/content'
import ListenPageClient from '@/components/ListenPageClient'

export const metadata: Metadata = {
  title: '听力 Listening',
  description: '中文听力练习，听中文选择正确意思，提升中文听力理解能力。Chinese listening practice for overseas children.',
  openGraph: {
    title: '听力 - 熊猫汉语',
    description: '中文听力练习，听中文选择正确意思，提升中文听力理解能力。',
  },
}

export default function ListenPage() {
  const levels = getLevels()
  const articles = getAllArticles()
  return <><ListenPageClient levels={levels} articles={articles} /><AdBanner /></>
}
