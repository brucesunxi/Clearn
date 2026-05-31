// Daily reading limit tracking
import { getReadingLimit as getRedisReadingLimit, setReadingLimit as setRedisReadingLimit } from './redis'

const READING_LIMIT_KEY = 'daily_reading_count'
const READING_DATE_KEY = 'daily_reading_date'
const DAILY_LIMIT = 3 // Free users can read 3 articles per day

// 获取当前用户ID
function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('chineselearn-user-id')
}

export interface ReadingLimitStatus {
  canRead: boolean
  remaining: number
  used: number
  limit: number
  isPremium: boolean
}

// 从 localStorage 读取
function getLocalReadingCount(): { count: number; date: string } {
  const today = new Date().toISOString().split('T')[0]
  const storedDate = localStorage.getItem(READING_DATE_KEY)
  const storedCount = localStorage.getItem(READING_LIMIT_KEY)

  // Reset if it's a new day
  if (storedDate !== today) {
    localStorage.setItem(READING_DATE_KEY, today)
    localStorage.setItem(READING_LIMIT_KEY, '0')
    return { count: 0, date: today }
  }

  return {
    count: parseInt(storedCount || '0', 10),
    date: storedDate || today
  }
}

// 异步获取（优先 Redis）
export async function getReadingCountAsync(): Promise<{ count: number; date: string }> {
  const userId = getCurrentUserId()
  if (userId) {
    try {
      const redisData = await getRedisReadingLimit(userId)
      if (redisData) return redisData
    } catch { /* ignore */ }
  }
  return getLocalReadingCount()
}

// 兼容旧版
export function getReadingCount(): { count: number; date: string } {
  return getLocalReadingCount()
}

// 异步增加计数
export async function incrementReadingCountAsync(): Promise<void> {
  const { count, date } = await getReadingCountAsync()
  const newData = { count: count + 1, date }

  // 保存到 localStorage
  localStorage.setItem(READING_LIMIT_KEY, String(newData.count))
  localStorage.setItem(READING_DATE_KEY, newData.date)

  // 同步到 Redis
  const userId = getCurrentUserId()
  if (userId) {
    try {
      await setRedisReadingLimit(userId, newData)
    } catch { /* ignore */ }
  }
}

// 兼容旧版
export function incrementReadingCount(): void {
  const { count, date } = getLocalReadingCount()
  localStorage.setItem(READING_LIMIT_KEY, String(count + 1))
  localStorage.setItem(READING_DATE_KEY, date)

  // 异步同步到 Redis
  const userId = getCurrentUserId()
  if (userId) {
    setRedisReadingLimit(userId, { count: count + 1, date }).catch(() => {})
  }
}

// TODO: Check if user has premium subscription
// For now, always return false since payment is not integrated
export function isPremiumUser(): boolean {
  return false
}

export async function getReadingLimitStatusAsync(): Promise<ReadingLimitStatus> {
  const isPremium = isPremiumUser()
  const { count } = await getReadingCountAsync()

  return {
    canRead: isPremium || count < DAILY_LIMIT,
    remaining: isPremium ? Infinity : Math.max(0, DAILY_LIMIT - count),
    used: count,
    limit: DAILY_LIMIT,
    isPremium
  }
}

// 兼容旧版
export function getReadingLimitStatus(): ReadingLimitStatus {
  const isPremium = isPremiumUser()
  const { count } = getLocalReadingCount()

  return {
    canRead: isPremium || count < DAILY_LIMIT,
    remaining: isPremium ? Infinity : Math.max(0, DAILY_LIMIT - count),
    used: count,
    limit: DAILY_LIMIT,
    isPremium
  }
}
