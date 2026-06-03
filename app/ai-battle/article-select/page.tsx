import type { Metadata } from 'next'
import { getAllArticles, getLevels } from '@/lib/content'
import ArticleSelectClient from '@/components/ArticleSelectClient'

export const metadata: Metadata = {
  title: 'Article Selection 选择文章 - AI Word Battle',
  description: 'Choose an article to start AI word battle and learn Chinese vocabulary through fun competition. 选择一篇文章开始AI单词对战，在有趣的比赛中学习中文词汇。',
  alternates: {
    canonical: 'https://pandahan.xyz/ai-battle/article-select',
    languages: {
      'en-US': 'https://pandahan.xyz/ai-battle/article-select',
      'zh-CN': 'https://pandahan.xyz/ai-battle/article-select',
    },
  },
  keywords: ['article selection', 'AI battle', 'vocabulary game', '选择文章', '对战'],
  openGraph: {
    title: 'Article Selection 选择文章 - Panda Chinese',
    description: 'Choose an article to start AI word battle. 选择文章开始AI单词对战。',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
  },
}

export default function ArticleSelectPage() {
  const articles = getAllArticles()
  const levels = getLevels()
  return <ArticleSelectClient articles={articles} levels={levels} />
}
