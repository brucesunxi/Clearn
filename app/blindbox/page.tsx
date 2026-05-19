import type { Metadata } from 'next'
import BlindBoxClient from '@/components/BlindBoxClient'

export const metadata: Metadata = {
  title: '神秘盲盒 Mystery Box',
  description: '花费金币抽取盲盒，赢取宠物食物和饰品！Spend coins on mystery boxes to win pet food and accessories!',
  openGraph: {
    title: '神秘盲盒 - 熊猫汉语',
    description: '花费金币抽取盲盒，赢取宠物食物和饰品！',
  },
}

export default function BlindBoxPage() {
  return <BlindBoxClient />
}
