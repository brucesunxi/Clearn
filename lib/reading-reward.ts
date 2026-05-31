// Reading reward tracking - 阅读文章获得金币奖励
// 不再限制阅读数量，改为奖励模式

const READING_COUNT_KEY = 'daily_reading_count'
const READING_DATE_KEY = 'daily_reading_date'
const READING_REWARD_KEY = 'daily_reading_reward_claimed'

export const READING_REWARD_COINS = 20 // 每篇文章奖励20金币

export interface ReadingRewardStatus {
  canRead: boolean      // 始终返回true，无限制
  remaining: number     // 返回Infinity，无限制
  used: number          // 今日已阅读数量
  limit: number         // 返回Infinity
  isPremium: boolean    // 返回true（无限制模式）
  rewardCoins: number   // 每篇文章奖励金币数
}

export function getReadingCount(): { count: number; date: string } {
  const today = new Date().toISOString().split('T')[0]
  const storedDate = localStorage.getItem(READING_DATE_KEY)
  const storedCount = localStorage.getItem(READING_COUNT_KEY)

  // Reset if it's a new day
  if (storedDate !== today) {
    localStorage.setItem(READING_DATE_KEY, today)
    localStorage.setItem(READING_COUNT_KEY, '0')
    localStorage.setItem(READING_REWARD_KEY, '[]')
    return { count: 0, date: today }
  }

  return {
    count: parseInt(storedCount || '0', 10),
    date: storedDate || today
  }
}

export function incrementReadingCount(): void {
  const { count } = getReadingCount()
  localStorage.setItem(READING_COUNT_KEY, String(count + 1))
}

export function isPremiumUser(): boolean {
  return true // 免费无限阅读模式
}

export function getReadingRewardStatus(): ReadingRewardStatus {
  const { count } = getReadingCount()

  return {
    canRead: true,
    remaining: Infinity,
    used: count,
    limit: Infinity,
    isPremium: true,
    rewardCoins: READING_REWARD_COINS
  }
}

// 标记某篇文章的金币已领取
export function markArticleRewardClaimed(articleId: string): void {
  const claimed = getClaimedRewards()
  if (!claimed.includes(articleId)) {
    claimed.push(articleId)
    localStorage.setItem(READING_REWARD_KEY, JSON.stringify(claimed))
  }
}

// 获取已领取奖励的文章列表
export function getClaimedRewards(): string[] {
  const raw = localStorage.getItem(READING_REWARD_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

// 检查文章是否已领取奖励
export function isArticleRewardClaimed(articleId: string): boolean {
  return getClaimedRewards().includes(articleId)
}

// 清理旧数据（可选）
export function cleanupOldReadingData(): void {
  localStorage.removeItem('daily_reading_count')
  localStorage.removeItem('daily_reading_date')
}
