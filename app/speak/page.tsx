import type { Metadata } from 'next'
import { AdBanner } from '@/lib/adsense'
import { getLevels, getAllArticles } from '@/lib/content'
import SpeakPageClient from '@/components/SpeakPageClient'

export const metadata: Metadata = {
  title: 'Speaking 口语 - Chinese Speaking Practice',
  description: 'Practice Chinese speaking with pronunciation feedback. Read Chinese aloud and improve your speaking skills! 中文口语练习，看中文开口说，提升中文发音和口语表达能力。',
  alternates: {
    canonical: 'https://pandahan.xyz/speak',
    languages: {
      'en-US': 'https://pandahan.xyz/speak',
      'zh-CN': 'https://pandahan.xyz/speak',
    },
  },
  keywords: ['Chinese speaking', 'speaking practice', 'pronunciation', 'learn Chinese', '中文口语', '口语练习'],
  openGraph: {
    title: 'Speaking 口语 - Panda Chinese',
    description: 'Practice Chinese speaking with pronunciation feedback. 中文口语练习，看中文开口说。',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
  },
}

export default function SpeakPage() {
  const levels = getLevels()
  const articles = getAllArticles()
  return <><SpeakPageClient levels={levels} articles={articles} /><AdBanner /></>
}
