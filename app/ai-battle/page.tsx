import type { Metadata } from 'next'
import { AdBanner } from '@/lib/adsense'
import { getAllArticles } from '@/lib/content'
import AiBattleGame from '@/components/AiBattleGame'

export const metadata: Metadata = {
  title: 'AI Word Battle AI单词对战 - Vocabulary Game',
  description: 'Battle AI with Chinese vocabulary across different difficulty levels. Fun way to learn Chinese words! 和 AI 比拼中文词汇，选择不同难度，在有趣的游戏中学习中文词汇。',
  alternates: {
    canonical: 'https://pandahan.xyz/ai-battle',
    languages: {
      'en-US': 'https://pandahan.xyz/ai-battle',
      'zh-CN': 'https://pandahan.xyz/ai-battle',
    },
  },
  keywords: ['AI battle', 'Chinese vocabulary game', 'word battle', 'learn Chinese', 'AI单词对战', '词汇游戏'],
  openGraph: {
    title: 'AI Word Battle AI单词对战 - PandaHan',
    description: 'Battle AI with Chinese vocabulary across different difficulty levels. 和 AI 比拼中文词汇。',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
  },
}

export default function AiBattlePage() {
  const articles = getAllArticles()
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <AiBattleGame articles={articles} />
    <AdBanner />
    </div>
  )
}
