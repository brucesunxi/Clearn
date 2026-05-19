import type { Metadata } from 'next'
import { getLevels, getAllArticles } from '@/lib/content'
import LearnPageClient from '@/components/LearnPageClient'

export const metadata: Metadata = {
  title: '单词记忆 Word Memorization',
  description: '使用艾宾浩斯遗忘曲线科学记单词，包含闪卡学习、每日打卡、学习进度追踪。Chinese vocabulary memorization with spaced repetition flashcards.',
  openGraph: {
    title: '单词记忆 - 熊猫汉语',
    description: '使用艾宾浩斯遗忘曲线科学记单词，包含闪卡学习和每日打卡。',
  },
}

export default function LearnPage() {
  const levels = getLevels()
  const articles = getAllArticles()
  return <LearnPageClient levels={levels} articles={articles} />
}
