import type { Metadata } from 'next'
import { AdBanner } from '@/lib/adsense'
import { getLevels, getAllArticles } from '@/lib/content'
import SpeakPageClient from '@/components/SpeakPageClient'

export const metadata: Metadata = {
  title: '口语 Speaking',
  description: '中文口语练习，看中文开口说，提升中文发音和口语表达能力。Chinese speaking practice with pronunciation feedback.',
  openGraph: {
    title: '口语 - 熊猫汉语',
    description: '中文口语练习，看中文开口说，提升中文发音和口语表达能力。',
  },
}

export default function SpeakPage() {
  const levels = getLevels()
  const articles = getAllArticles()
  return <><SpeakPageClient levels={levels} articles={articles} /><AdBanner /></>
}
