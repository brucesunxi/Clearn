import type { Metadata } from 'next'
import { AdBanner } from '@/lib/adsense'
import { getAllArticles } from '@/lib/content'
import ListenSpeakPageClient from '@/components/ListenSpeakPageClient'

export const metadata: Metadata = {
  title: '听力口语 Listening & Speaking',
  description: '中文听力口语综合练习，包含听力选择、精听训练、口语朗读，全面提升中文听说能力。Chinese listening and speaking practice for overseas children.',
  openGraph: {
    title: '听力口语 - 熊猫汉语',
    description: '中文听力口语综合练习，包含听力选择、精听训练、口语朗读。',
  },
}

export default function PracticePage() {
  const articles = getAllArticles()
  return <><ListenSpeakPageClient articles={articles} /><AdBanner /></>
}
