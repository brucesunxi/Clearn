// Import limit tracking - 自定义文章导入限制
// 每天免费3篇，超出需30金币/篇

const IMPORT_COUNT_KEY = 'daily_import_count'
const IMPORT_DATE_KEY = 'daily_import_date'
const IMPORTED_ARTICLES_KEY = 'daily_imported_articles'

export const IMPORT_CONFIG = {
  FREE_LIMIT: 3,           // 每天免费导入数量
  EXTRA_COST: 30,          // 超出后每篇金币
  MONTHLY_CARD_COST: 300,  // 月卡价格（暂未实现）
}

export interface ImportLimitStatus {
  used: number              // 今日已导入数量
  freeLimit: number         // 免费额度
  remainingFree: number     // 剩余免费额度
  canImport: boolean        // 是否可以导入（始终true，只是可能需付费）
  needCoins: number         // 需要支付的金币（0或30）
  isOverLimit: boolean      // 是否已超出免费额度
}

export function getImportCount(): { count: number; date: string } {
  const today = new Date().toISOString().split('T')[0]
  const storedDate = localStorage.getItem(IMPORT_DATE_KEY)
  const storedCount = localStorage.getItem(IMPORT_COUNT_KEY)

  // Reset if it's a new day
  if (storedDate !== today) {
    localStorage.setItem(IMPORT_DATE_KEY, today)
    localStorage.setItem(IMPORT_COUNT_KEY, '0')
    localStorage.setItem(IMPORTED_ARTICLES_KEY, '[]')
    return { count: 0, date: today }
  }

  return {
    count: parseInt(storedCount || '0', 10),
    date: storedDate || today
  }
}

export function incrementImportCount(): void {
  const { count } = getImportCount()
  localStorage.setItem(IMPORT_COUNT_KEY, String(count + 1))
}

export function getImportLimitStatus(): ImportLimitStatus {
  const { count } = getImportCount()
  const remainingFree = Math.max(0, IMPORT_CONFIG.FREE_LIMIT - count)
  const isOverLimit = count >= IMPORT_CONFIG.FREE_LIMIT

  return {
    used: count,
    freeLimit: IMPORT_CONFIG.FREE_LIMIT,
    remainingFree,
    canImport: true, // 始终可以导入，只是可能需要金币
    needCoins: isOverLimit ? IMPORT_CONFIG.EXTRA_COST : 0,
    isOverLimit
  }
}

// 检查导入是否需要金币
export function checkImportCost(): { allowed: boolean; cost: number; message: string } {
  const status = getImportLimitStatus()

  if (status.isOverLimit) {
    return {
      allowed: true,
      cost: IMPORT_CONFIG.EXTRA_COST,
      message: `今日免费额度已用完，本次导入需要 ${IMPORT_CONFIG.EXTRA_COST} 金币`
    }
  }

  return {
    allowed: true,
    cost: 0,
    message: `免费导入 ${status.used + 1}/${IMPORT_CONFIG.FREE_LIMIT}`
  }
}

// 记录已导入的文章ID
export function recordImportedArticle(articleId: string): void {
  const imported = getImportedArticles()
  if (!imported.includes(articleId)) {
    imported.push(articleId)
    localStorage.setItem(IMPORTED_ARTICLES_KEY, JSON.stringify(imported))
  }
}

// 获取今日已导入的文章列表
export function getImportedArticles(): string[] {
  const raw = localStorage.getItem(IMPORTED_ARTICLES_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

// 检查文章是否已导入（防止重复计费）
export function isArticleImported(articleId: string): boolean {
  return getImportedArticles().includes(articleId)
}
