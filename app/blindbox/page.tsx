import type { Metadata } from 'next'
import { AdBanner } from '@/lib/adsense'
import BlindBoxClient from '@/components/BlindBoxClient'

export const metadata: Metadata = {
  title: 'Mystery Box 神秘盲盒 - Win Pet Rewards',
  description: 'Spend coins on mystery boxes to win pet food and accessories for your panda companion! 花费金币抽取盲盒，赢取宠物食物和饰品！',
  alternates: {
    canonical: 'https://pandahan.xyz/blindbox',
    languages: {
      'en-US': 'https://pandahan.xyz/blindbox',
      'zh-CN': 'https://pandahan.xyz/blindbox',
    },
  },
  keywords: ['mystery box', 'blind box', 'pet rewards', '神秘盲盒', '宠物奖励'],
  openGraph: {
    title: 'Mystery Box 神秘盲盒 - PandaHan',
    description: 'Spend coins on mystery boxes to win pet food and accessories! 花费金币抽取盲盒，赢取宠物食物和饰品！',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
  },
}

export default function BlindBoxPage() {
  return <><BlindBoxClient /><AdBanner /></>
}
