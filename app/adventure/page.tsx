import type { Metadata } from 'next'
import AdventureMap from '@/components/AdventureMap'
import { getAdventureLevels } from '@/lib/adventure'

export const metadata: Metadata = {
  title: 'Adventure 冒险 - Panda Quest',
  description: 'Embark on adventures with your panda! Challenge levels, earn rewards, and become stronger. 带着你的熊猫去冒险！挑战关卡，赢取奖励。',
  alternates: {
    canonical: 'https://pandahan.xyz/adventure',
    languages: {
      'en-US': 'https://pandahan.xyz/adventure',
      'zh-CN': 'https://pandahan.xyz/adventure',
    },
  },
  keywords: ['adventure', 'panda quest', 'game', 'levels', '熊猫冒险', '闯关'],
  openGraph: {
    title: 'Adventure 冒险 - Panda Chinese',
    description: 'Embark on adventures with your panda! 带着你的熊猫去冒险！',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
  },
}

export default function AdventurePage() {
  const levels = getAdventureLevels()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <span className="text-4xl">🗺️</span>
          Adventure Map 冒险地图
        </h1>
        <p className="text-gray-500">
          Challenge levels with your panda to earn rewards! 挑战关卡赢取奖励！
        </p>
      </div>

      {/* Adventure Map */}
      <AdventureMap levels={levels} />
    </div>
  )
}
