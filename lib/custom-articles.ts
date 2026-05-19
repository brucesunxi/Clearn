import type { Article } from './types'

const STORAGE_KEY = 'chineselearn-custom-articles'

export function getCustomArticles(): Article[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Article[]
  } catch {
    return []
  }
}

export function getCustomArticle(id: string): Article | undefined {
  return getCustomArticles().find((a) => a.id === id)
}

export function saveCustomArticle(article: Article): void {
  if (typeof window === 'undefined') return
  const articles = getCustomArticles()
  const idx = articles.findIndex((a) => a.id === article.id)
  if (idx !== -1) {
    articles[idx] = article
  } else {
    articles.push(article)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles))
}

export function deleteCustomArticle(id: string): void {
  if (typeof window === 'undefined') return
  const articles = getCustomArticles().filter((a) => a.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles))
}
