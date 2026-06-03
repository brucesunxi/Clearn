import type { Metadata } from 'next'
import { AdBanner } from '@/lib/adsense'
import { getLevels, getAllArticles } from '@/lib/content'
import ListenPageClient from '@/components/ListenPageClient'

export const metadata: Metadata = {
  title: 'Listening 听力 - Chinese Listening Practice',
  description: 'Practice Chinese listening comprehension with audio exercises. Improve your Chinese listening skills! 中文听力练习，听中文选择正确意思，提升中文听力理解能力。',
  alternates: {
    canonical: 'https://pandahan.xyz/listen',
    languages: {
      'en-US': 'https://pandahan.xyz/listen',
      'zh-CN': 'https://pandahan.xyz/listen',
    },
  },
  keywords: ['Chinese listening', 'listening practice', 'learn Chinese', '中文听力', '听力练习'],
  openGraph: {
    title: 'Listening 听力 - Panda Chinese',
    description: 'Practice Chinese listening comprehension. 中文听力练习，听中文选择正确意思。',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
  },
}

export default function ListenPage() {
  const levels = getLevels()
  const articles = getAllArticles()
  return <><ListenPageClient levels={levels} articles={articles} /><AdBanner /></>
}
