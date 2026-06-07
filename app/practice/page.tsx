import type { Metadata } from 'next'
import { AdBanner } from '@/lib/adsense'
import { getLevels, getAllArticles } from '@/lib/content'
import ListenSpeakPageClient from '@/components/ListenSpeakPageClient'

export const metadata: Metadata = {
  title: 'Listening & Speaking 听力口语 - Combined Practice',
  description: 'Combined Chinese listening and speaking practice. Multiple choice listening, intensive listening, and speaking drills. 中文听力口语综合练习，包含听力选择、精听训练、口语朗读。',
  alternates: {
    canonical: 'https://pandahan.xyz/practice',
    languages: {
      'en-US': 'https://pandahan.xyz/practice',
      'zh-CN': 'https://pandahan.xyz/practice',
    },
  },
  keywords: ['Chinese listening', 'Chinese speaking', 'practice', 'learn Chinese', '听力口语', '练习'],
  openGraph: {
    title: 'Listening & Speaking 听力口语 - PandaHan',
    description: 'Combined Chinese listening and speaking practice. 中文听力口语综合练习。',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
  },
}

export default function PracticePage() {
  const levels = getLevels()
  const articles = getAllArticles()
  return <><ListenSpeakPageClient levels={levels} articles={articles} /><AdBanner /></>
}
