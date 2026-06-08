import type { Metadata } from 'next'
import { AdBanner } from '@/lib/adsense'
import PetPageClient from '@/components/PetPageClient'

export const metadata: Metadata = {
  title: 'Panda Companion 熊猫伙伴 - Learn & Play',
  description: 'Play with your panda companion in PandaHan! Learning makes your bond stronger! 在 PandaHan 中和熊猫伙伴一起学习互动，坚持学习就能加深羁绊！',
  alternates: {
    canonical: 'https://pandahan.xyz/pet',
    languages: {
      'en-US': 'https://pandahan.xyz/pet',
      'zh-CN': 'https://pandahan.xyz/pet',
    },
  },
  keywords: ['panda companion', 'learning buddy', '熊猫伙伴', '学习伙伴'],
  openGraph: {
    title: 'Panda Companion 熊猫伙伴 - PandaHan',
    description: 'Play with your panda companion! Learning makes your bond stronger! 和熊猫伙伴一起互动，坚持学习加深羁绊！',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
  },
}

export default function PetPage() {
  return <><PetPageClient /><AdBanner /></>
}
