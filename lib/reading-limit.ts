// Daily reading limit tracking
const READING_LIMIT_KEY = 'daily_reading_count'
const READING_DATE_KEY = 'daily_reading_date'
const DAILY_LIMIT = 3 // Free users can read 3 articles per day

export interface ReadingLimitStatus {
  canRead: boolean
  remaining: number
  used: number
  limit: number
  isPremium: boolean
}

export function getReadingCount(): { count: number; date: string } {
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

export function incrementReadingCount(): void {
  const { count } = getReadingCount()
  localStorage.setItem(READING_LIMIT_KEY, String(count + 1))
}

// TODO: Check if user has premium subscription
// For now, always return false since payment is not integrated
export function isPremiumUser(): boolean {
  return false
}

export function getReadingLimitStatus(): ReadingLimitStatus {
  const isPremium = isPremiumUser()
  const { count } = getReadingCount()

  return {
    canRead: isPremium || count < DAILY_LIMIT,
    remaining: isPremium ? Infinity : Math.max(0, DAILY_LIMIT - count),
    used: count,
    limit: DAILY_LIMIT,
    isPremium
  }
}
