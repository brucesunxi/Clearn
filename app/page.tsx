import type { Metadata } from 'next'
import { getAllArticles } from '@/lib/content'
import HomePageClient from '@/components/HomePageClient'

export const metadata: Metadata = {
  title: '首页 Home',
  alternates: {
    canonical: 'https://pandahan.xyz/',
  },
  description: '为海外华裔儿童打造的中文学习平台，包含分级阅读、单词记忆、听力口语练习。Chinese learning platform for overseas children with leveled reading, vocabulary drills, and listening & speaking practice.',
  openGraph: {
    title: '熊猫汉语 - 海外华裔儿童中文学习平台',
    description: '为海外华裔儿童打造的中文学习平台，包含分级阅读、单词记忆、听力口语练习。',
  },
}

export default function HomePage() {
  const allArticles = getAllArticles()
  return <HomePageClient totalArticles={allArticles.length} />
}
