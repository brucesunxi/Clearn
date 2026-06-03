import type { Metadata } from 'next'
import { AdBanner } from '@/lib/adsense'
import { getLevels, getAllArticles } from '@/lib/content'
import LearnPageClient from '@/components/LearnPageClient'

export const metadata: Metadata = {
  title: 'Word Memorization 单词记忆 - Flashcards & Spaced Repetition',
  description: 'Master Chinese vocabulary with spaced repetition flashcards. Scientific learning based on Ebbinghaus forgetting curve. 使用艾宾浩斯遗忘曲线科学记单词，包含闪卡学习、每日打卡、学习进度追踪。',
  alternates: {
    canonical: 'https://pandahan.xyz/learn',
    languages: {
      'en-US': 'https://pandahan.xyz/learn',
      'zh-CN': 'https://pandahan.xyz/learn',
    },
  },
  keywords: ['Chinese vocabulary', 'flashcards', 'spaced repetition', 'learn Chinese words', '单词记忆', '闪卡', '艾宾浩斯'],
  openGraph: {
    title: 'Word Memorization 单词记忆 - Panda Chinese',
    description: 'Master Chinese vocabulary with spaced repetition flashcards. 使用艾宾浩斯遗忘曲线科学记单词。',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
  },
}

export default function LearnPage() {
  const levels = getLevels()
  const articles = getAllArticles()
  return <><LearnPageClient levels={levels} articles={articles} /><AdBanner /></>
}
