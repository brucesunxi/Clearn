import type { Metadata } from 'next'
import PetPageClient from '@/components/PetPageClient'

export const metadata: Metadata = {
  title: '熊猫伙伴 Panda Pet',
  description: '在熊猫汉语中养一只可爱的熊猫伙伴，坚持学习就能让它成长！A cute panda pet companion to motivate Chinese learning.',
  openGraph: {
    title: '熊猫伙伴 - 熊猫汉语',
    description: '在熊猫汉语中养一只可爱的熊猫伙伴，坚持学习就能让它成长！',
  },
}

export default function PetPage() {
  return <PetPageClient />
}
