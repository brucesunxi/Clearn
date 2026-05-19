'use client'

import { useCustomArticles } from '@/lib/use-custom-articles'
import ListenSession from './ListenSession'
import type { Article } from '@/lib/types'

export default function ClientListenSession({ articles: base }: { articles: Article[] }) {
  const articles = useCustomArticles(base)
  return <ListenSession articles={articles} />
}
