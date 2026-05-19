import type { Metadata } from 'next'
import { getAllArticles, getLevels } from '@/lib/content'
import ArticleSelectClient from '@/components/ArticleSelectClient'

export const metadata: Metadata = {
  title: '选择文章 — AI 单词对战',
  description: '选择要用来对战的文章',
}

export default function ArticleSelectPage() {
  const articles = getAllArticles()
  const levels = getLevels()
  return <ArticleSelectClient articles={articles} levels={levels} />
}
