import type { Metadata } from 'next'
import AiBattleGame from '@/components/AiBattleGame'

export const metadata: Metadata = {
  title: 'AI 单词对战 AI Word Battle',
  description: '和 AI 比拼中文词汇，选择不同难度，看谁更厉害！Battle AI with Chinese vocabulary across different difficulty levels.',
  openGraph: {
    title: 'AI 单词对战 - 熊猫汉语',
    description: '和 AI 比拼中文词汇，选择不同难度，看谁更厉害！',
  },
}

export default function AiBattlePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <AiBattleGame />
    </div>
  )
}
