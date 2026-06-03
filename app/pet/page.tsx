import type { Metadata } from 'next'
import { AdBanner } from '@/lib/adsense'
import PetPageClient from '@/components/PetPageClient'

export const metadata: Metadata = {
  title: 'Panda Pet 熊猫伙伴 - Virtual Pet Companion',
  description: 'Raise a cute panda companion in Panda Chinese. Consistent learning makes your pet grow! 在熊猫汉语中养一只可爱的熊猫伙伴，坚持学习就能让它成长！',
  alternates: {
    canonical: 'https://pandahan.xyz/pet',
    languages: {
      'en-US': 'https://pandahan.xyz/pet',
      'zh-CN': 'https://pandahan.xyz/pet',
    },
  },
  keywords: ['panda pet', 'virtual pet', 'learning companion', '熊猫伙伴', '虚拟宠物'],
  openGraph: {
    title: 'Panda Pet 熊猫伙伴 - Panda Chinese',
    description: 'Raise a cute panda companion. Consistent learning makes your pet grow! 养一只可爱的熊猫伙伴，坚持学习就能让它成长！',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
  },
}

export default function PetPage() {
  return <><PetPageClient /><AdBanner /></>
}
