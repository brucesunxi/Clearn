import type { Metadata } from 'next'
import StatsPageClient from '@/components/StatsPageClient'

export const metadata: Metadata = {
  title: 'Learning Stats 学习统计 - Track Your Progress',
  description: 'Track your Chinese learning progress with vocabulary mastery stats, memory stage distribution, and learning streak. 查看你的中文学习进度，包括词汇掌握情况、记忆阶段分布、学习连续天数等统计数据。',
  alternates: {
    canonical: 'https://pandahan.xyz/stats',
    languages: {
      'en-US': 'https://pandahan.xyz/stats',
      'zh-CN': 'https://pandahan.xyz/stats',
    },
  },
  keywords: ['learning stats', 'progress tracking', 'vocabulary mastery', '学习统计', '进度追踪'],
  openGraph: {
    title: 'Learning Stats 学习统计 - Panda Chinese',
    description: 'Track your Chinese learning progress. 查看你的中文学习进度和统计数据。',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
  },
}

export default function StatsPage() {
  return <StatsPageClient />
}
