'use client'

import { useCustomArticles } from '@/lib/use-custom-articles'
import SpeakSession from './SpeakSession'
import type { Article } from '@/lib/types'

export default function ClientSpeakSession({ articles: base }: { articles: Article[] }) {
  const articles = useCustomArticles(base)
  return <SpeakSession articles={articles} />
}
