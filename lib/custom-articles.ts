import type { Article } from './types'
import { getCustomArticles as getRedisCustomArticles, setCustomArticles as setRedisCustomArticles } from './redis'

const STORAGE_KEY = 'chineselearn-custom-articles'

// 获取当前用户ID
function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('chineselearn-user-id')
}

// 从 localStorage 读取
function getLocalCustomArticles(): Article[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Article[]
  } catch {
    return []
  }
}

// 异步获取（优先 Redis）
export async function getCustomArticlesAsync(): Promise<Article[]> {
  const userId = getCurrentUserId()
  if (userId) {
    try {
      const redisData = await getRedisCustomArticles(userId)
      if (redisData) return redisData
    } catch { /* ignore */ }
  }
  return getLocalCustomArticles()
}

// 兼容旧版
export function getCustomArticles(): Article[] {
  return getLocalCustomArticles()
}

export function getCustomArticle(id: string): Article | undefined {
  return getLocalCustomArticles().find((a) => a.id === id)
}

export async function saveCustomArticle(article: Article): Promise<void> {
  if (typeof window === 'undefined') return
  const articles = getLocalCustomArticles()
  const idx = articles.findIndex((a) => a.id === article.id)
  if (idx !== -1) {
    articles[idx] = article
  } else {
    articles.push(article)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles))

  // 同步到 Redis
  const userId = getCurrentUserId()
  if (userId) {
    try {
      await setRedisCustomArticles(userId, articles)
    } catch { /* ignore */ }
  }
}

export async function deleteCustomArticle(id: string): Promise<void> {
  if (typeof window === 'undefined') return
  const articles = getLocalCustomArticles().filter((a) => a.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles))

  // 同步到 Redis
  const userId = getCurrentUserId()
  if (userId) {
    try {
      await setRedisCustomArticles(userId, articles)
    } catch { /* ignore */ }
  }
}

// 迁移函数
export async function migrateCustomArticlesToRedis(userId: string): Promise<void> {
  const articles = getLocalCustomArticles()
  if (articles.length > 0) {
    try {
      await setRedisCustomArticles(userId, articles)
    } catch { /* ignore */ }
  }
}
