import { Redis } from '@upstash/redis'

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

let client: Redis | null = null

export function getRedis(): Redis | null {
  if (!client) {
    client = createRedis()
  }
  return client
}

export function getCoinsKey(userId: string): string {
  return `coins:${userId}`
}

const STARTING_COINS = 500

export async function getCoins(userId: string): Promise<number> {
  const redis = getRedis()
  if (!redis) return STARTING_COINS // fallback when no Redis configured
  try {
    const val = await redis.get<number>(getCoinsKey(userId))
    if (val === null || val === undefined) {
      await redis.set(getCoinsKey(userId), STARTING_COINS)
      return STARTING_COINS
    }
    return val
  } catch {
    return STARTING_COINS
  }
}

/** Get coins from Redis only if the key already exists; never creates a default entry. */
export async function peekCoins(userId: string): Promise<number | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const val = await redis.get<number>(getCoinsKey(userId))
    return val ?? null
  } catch {
    return null
  }
}

export async function addCoins(userId: string, amount: number): Promise<number> {
  const redis = getRedis()
  if (!redis) return STARTING_COINS + amount
  const current = await getCoins(userId)
  const newBalance = current + amount
  await redis.set(getCoinsKey(userId), newBalance)
  return newBalance
}

export async function spendCoins(userId: string, amount: number): Promise<{ success: boolean; balance: number }> {
  const redis = getRedis()
  if (!redis) return { success: true, balance: STARTING_COINS - amount }
  const current = await getCoins(userId)
  if (current < amount) {
    return { success: false, balance: current }
  }
  const newBalance = current - amount
  await redis.set(getCoinsKey(userId), newBalance)
  return { success: true, balance: newBalance }
}

// ---- Coin History ----

export interface CoinHistoryEntry {
  id: string
  amount: number
  reason: string
  balance: number
  createdAt: string
  detail: string
}

function coinHistoryIndexKey(userId: string): string {
  return `coins:history:${userId}`
}

function coinHistoryEntryKey(id: string): string {
  return `coins:history:entry:${id}`
}

function generateHistoryEntryId(): string {
  return `ch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export async function addCoinHistory(
  userId: string,
  amount: number,
  reason: string,
  balance: number,
  detail?: string,
): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  const entry: CoinHistoryEntry = {
    id: generateHistoryEntryId(),
    amount,
    reason,
    balance,
    createdAt: new Date().toISOString(),
    detail: detail || '',
  }
  try {
    await redis.set(coinHistoryEntryKey(entry.id), JSON.stringify(entry))
    await appendToArrayIndex(redis, coinHistoryIndexKey(userId), entry.id)
  } catch {
    // Coin history unavailable; non-critical
  }
}

export async function getCoinHistory(userId: string): Promise<CoinHistoryEntry[]> {
  const redis = getRedis()
  if (!redis) return []
  try {
    const ids = await readArrayIndex(redis, coinHistoryIndexKey(userId))
    if (ids.length === 0) return []
    const rawEntries = await Promise.all(
      ids.map((id) => redis.get<any>(coinHistoryEntryKey(id))),
    )
    return rawEntries
      .filter((e) => e !== null && e !== undefined)
      .map((e) => {
        if (typeof e === 'string') return JSON.parse(e) as CoinHistoryEntry
        return e as CoinHistoryEntry
      })
  } catch {
    return []
  }
}

// ---- User Accounts ----

export interface UserRecord {
  userId: string
  email: string
  passwordHash: string
  createdAt: string
  emailVerified: boolean
  verificationToken: string | null
}

function userEmailKey(email: string): string {
  return `user:email:${email.toLowerCase().trim()}`
}

function userKey(userId: string): string {
  return `user:${userId}`
}

/**
 * Create a new user account. Returns false if the email is already taken.
 * Uses SET NX to atomically check-and-set the email index.
 */
export async function createUser(
  userId: string,
  email: string,
  passwordHash: string,
): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return false
  try {
    const emailLookup = userEmailKey(email)
    // SET NX — only succeeds if key doesn't exist
    const nxResult = await redis.set(emailLookup, userId, { nx: true })
    if (nxResult !== 'OK') return false // email already taken

    await redis.set(userKey(userId), JSON.stringify({
      userId,
      email: email.toLowerCase().trim(),
      passwordHash,
      createdAt: new Date().toISOString(),
      emailVerified: false,
      verificationToken: null,
    } satisfies UserRecord))
    return true
  } catch {
    return false
  }
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const userId = await redis.get<string>(userEmailKey(email))
    if (!userId) return null
    return getUser(userId)
  } catch {
    return null
  }
}

export async function getUser(userId: string): Promise<UserRecord | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const raw = await redis.get<any>(userKey(userId))
    if (!raw) return null
    if (typeof raw === 'string') return JSON.parse(raw) as UserRecord
    return raw as UserRecord
  } catch {
    return null
  }
}

export async function setVerificationToken(userId: string, token: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  const user = await getUser(userId)
  if (!user) return
  user.verificationToken = token
  await redis.set(userKey(userId), JSON.stringify(user))
  // Index for quick lookup during verification
  await redis.set(`verification:token:${token}`, userId, { ex: 86400 }) // 24h TTL
}

export async function getAllUsers(): Promise<UserRecord[]> {
  const redis = getRedis()
  if (!redis) return []
  const users: UserRecord[] = []
  try {
    let cursor = 0
    do {
      const result = await redis.scan(cursor, { match: 'user:*', count: 100 })
      cursor = parseInt(result[0], 10)
      const keys = result[1]
      for (const key of keys) {
        if (key.startsWith('user:email:')) continue
        const raw = await redis.get<any>(key)
        if (!raw) continue
        const user = typeof raw === 'string' ? JSON.parse(raw) : raw as UserRecord
        if (user.email) users.push(user)
      }
    } while (cursor !== 0)
  } catch {}
  return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function markEmailVerified(token: string): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return false
  try {
    const userId = await redis.get<string>(`verification:token:${token}`)
    if (!userId) return false
    const user = await getUser(userId)
    if (!user) return false
    user.emailVerified = true
    user.verificationToken = null
    await redis.set(userKey(userId), JSON.stringify(user))
    await redis.del(`verification:token:${token}`)
    return true
  } catch { return false }
}

/** Admin function: directly verify a user's email by email address */
export async function verifyEmailByAddress(email: string): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return false
  try {
    const user = await getUserByEmail(email)
    if (!user) return false
    user.emailVerified = true
    user.verificationToken = null
    await redis.set(userKey(user.userId), JSON.stringify(user))
    return true
  } catch { return false }
}

// ---- Inventory ----

export interface InventoryData {
  food: Record<string, number>
  accessories: Record<string, boolean>
  equipped: string[]
}

function invKey(uid: string) { return `inventory:${uid}` }

export async function getInventory(userId: string): Promise<InventoryData | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const raw = await redis.get<any>(invKey(userId))
    if (!raw) return null
    if (typeof raw === 'string') return JSON.parse(raw) as InventoryData
    return raw as InventoryData
  } catch { return null }
}

export async function setInventory(userId: string, data: InventoryData): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  await redis.set(invKey(userId), JSON.stringify(data))
}

// ---- Pet ----

export interface PetData {
  hunger: number
  happiness: number
  lastUpdated: string
}

function petKey(uid: string) { return `pet:${uid}` }

export async function getPet(userId: string): Promise<PetData | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const raw = await redis.get<any>(petKey(userId))
    if (!raw) return null
    if (typeof raw === 'string') return JSON.parse(raw) as PetData
    return raw as PetData
  } catch { return null }
}

export async function setPet(userId: string, data: PetData): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  await redis.set(petKey(userId), JSON.stringify(data))
}

// ---- Check-in ----

export interface CheckinData {
  history: string[]
  currentStreak: number
  longestStreak: number
}

function checkinKey(uid: string) { return `checkin:${uid}` }

export async function getCheckin(userId: string): Promise<CheckinData | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const raw = await redis.get<any>(checkinKey(userId))
    if (!raw) return null
    if (typeof raw === 'string') return JSON.parse(raw) as CheckinData
    return raw as CheckinData
  } catch { return null }
}

export async function setCheckin(userId: string, data: CheckinData): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  await redis.set(checkinKey(userId), JSON.stringify(data))
}

// ---- Generic array-index helpers (avoids JSON auto-parse in @upstash/redis v1.x) ----

async function readArrayIndex(redis: Redis, key: string): Promise<string[]> {
  try {
    const raw = await redis.get<string>(key)
    if (!raw) return []
    // Stored as pipe-delimited string to avoid @upstash/redis auto-parsing JSON arrays
    return raw.split('|').filter(Boolean)
  } catch {
    // Key may be a sorted set from old code; delete and start fresh
    try { await redis.del(key) } catch { /* ignore */ }
    return []
  }
}

async function appendToArrayIndex(redis: Redis, key: string, id: string): Promise<void> {
  try {
    const ids = await readArrayIndex(redis, key)
    ids.push(id)
    await redis.set(key, ids.join('|'))
  } catch {
    // Index unavailable
  }
}

async function removeFromArrayIndex(redis: Redis, key: string, id: string): Promise<void> {
  try {
    const ids = await readArrayIndex(redis, key)
    const idx = ids.indexOf(id)
    if (idx !== -1) ids.splice(idx, 1)
    await redis.set(key, ids.join('|'))
  } catch {
    // Index unavailable
  }
}

// ---- Feedback ----

export interface FeedbackEntry {
  id: string
  userId: string
  message: string
  contact: string
  createdAt: string
  read: boolean
}

function generateFeedbackId(): string {
  return `fb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const FEEDBACK_IDS_KEY = 'feedback:ids'

function feedbackKey(id: string): string {
  return `feedback:${id}`
}

export async function createFeedback(
  userId: string,
  message: string,
  contact: string,
): Promise<FeedbackEntry | null> {
  const redis = getRedis()
  if (!redis) return null
  const entry: FeedbackEntry = {
    id: generateFeedbackId(),
    userId,
    message,
    contact,
    createdAt: new Date().toISOString(),
    read: false,
  }
  try {
    await redis.set(feedbackKey(entry.id), JSON.stringify(entry))
    await appendToArrayIndex(redis, FEEDBACK_IDS_KEY, entry.id)
  } catch {
    // Redis unavailable; data won't persist but user still gets success response
  }
  return entry
}

export async function getFeedbackEntries(
  page: number,
  pageSize: number,
): Promise<{ entries: FeedbackEntry[]; total: number } | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const ids = await readArrayIndex(redis, FEEDBACK_IDS_KEY)
    const total = ids.length
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1
    // Show newest first (reverse)
    const pageIds = ids.slice(start, end + 1).reverse()
    if (pageIds.length === 0) return { entries: [], total }
    const rawEntries = await Promise.all(
      pageIds.map((id: string) => redis.get<string>(feedbackKey(id))),
    )
    const entries = rawEntries
      .filter((e) => e !== null && e !== undefined)
      .map((e) => {
        // @upstash/redis auto-parses JSON strings, so e may already be an object
        if (typeof e === 'string') return JSON.parse(e) as FeedbackEntry
        return e as unknown as FeedbackEntry
      })
    return { entries, total }
  } catch {
    return { entries: [], total: 0 }
  }
}

export async function markFeedbackRead(id: string): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return false
  const raw = await redis.get<any>(feedbackKey(id))
  if (!raw) return false
  const entry = (typeof raw === 'string' ? JSON.parse(raw) : raw) as FeedbackEntry
  entry.read = true
  await redis.set(feedbackKey(id), JSON.stringify(entry))
  return true
}

export async function deleteFeedback(id: string): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return false
  try {
    await redis.del(feedbackKey(id))
    await removeFromArrayIndex(redis, FEEDBACK_IDS_KEY, id)
    return true
  } catch {
    return false
  }
}

// ---- Activity Tracking ----

export interface ActivityEntry {
  id: string
  userId: string
  action: string
  detail: string
  createdAt: string
}

const ACTIVITY_IDS_KEY = 'activity:ids'
const ACTIVITY_TTL_SEC = 60 * 60 * 24 * 30 // 30 days

function generateActivityId(): string {
  return `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function activityKey(id: string): string {
  return `activity:${id}`
}

export async function createActivity(
  userId: string,
  action: string,
  detail?: string,
): Promise<ActivityEntry | null> {
  const redis = getRedis()
  if (!redis) return null
  const entry: ActivityEntry = {
    id: generateActivityId(),
    userId,
    action,
    detail: detail || '',
    createdAt: new Date().toISOString(),
  }
  try {
    await redis.set(activityKey(entry.id), JSON.stringify(entry), { ex: ACTIVITY_TTL_SEC })
    await appendToArrayIndex(redis, ACTIVITY_IDS_KEY, entry.id)
  } catch {
    // Redis unavailable
  }
  return entry
}

export async function getActivityEntries(
  page: number,
  pageSize: number,
): Promise<{ entries: ActivityEntry[]; total: number } | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const ids = await readArrayIndex(redis, ACTIVITY_IDS_KEY)
    const total = ids.length
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1
    const pageIds = ids.slice(start, end + 1).reverse()
    if (pageIds.length === 0) return { entries: [], total }
    const rawEntries = await Promise.all(
      pageIds.map((id: string) => redis.get<string>(activityKey(id))),
    )
    const entries = rawEntries
      .filter((e) => e !== null && e !== undefined)
      .map((e) => {
        if (typeof e === 'string') return JSON.parse(e) as ActivityEntry
        return e as unknown as ActivityEntry
      })
    return { entries, total }
  } catch {
    return { entries: [], total: 0 }
  }
}

// ---- Word Progress ----

export interface WordProgressData {
  word: string
  meaning: string
  pinyin: string
  stage: number
  nextReview: string
  reviewCount: number
  lastReviewDate: string
  articleId: string
}

function wordsProgressKey(uid: string) { return `words:progress:${uid}` }

export async function getWordsProgress(userId: string): Promise<Record<string, WordProgressData> | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const raw = await redis.get<any>(wordsProgressKey(userId))
    if (!raw) return null
    if (typeof raw === 'string') return JSON.parse(raw) as Record<string, WordProgressData>
    return raw as Record<string, WordProgressData>
  } catch { return null }
}

export async function setWordsProgress(userId: string, data: Record<string, WordProgressData>): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  await redis.set(wordsProgressKey(userId), JSON.stringify(data))
}

// ---- Reading Limit ----

export interface ReadingLimitData {
  count: number
  date: string
}

function readingLimitKey(uid: string) { return `reading:limit:${uid}` }

export async function getReadingLimit(userId: string): Promise<ReadingLimitData | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const raw = await redis.get<any>(readingLimitKey(userId))
    if (!raw) return null
    if (typeof raw === 'string') return JSON.parse(raw) as ReadingLimitData
    return raw as ReadingLimitData
  } catch { return null }
}

export async function setReadingLimit(userId: string, data: ReadingLimitData): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  await redis.set(readingLimitKey(userId), JSON.stringify(data))
}

// ---- Import Limit ----

export interface ImportLimitData {
  count: number
  date: string
  articles: string[]
}

function importLimitKey(uid: string) { return `import:limit:${uid}` }

export async function getImportLimit(userId: string): Promise<ImportLimitData | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const raw = await redis.get<any>(importLimitKey(userId))
    if (!raw) return null
    if (typeof raw === 'string') return JSON.parse(raw) as ImportLimitData
    return raw as ImportLimitData
  } catch { return null }
}

export async function setImportLimit(userId: string, data: ImportLimitData): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  await redis.set(importLimitKey(userId), JSON.stringify(data))
}

// ---- Custom Articles ----

import type { Article } from './types'

function customArticlesKey(uid: string) { return `articles:custom:${uid}` }

export async function getCustomArticles(userId: string): Promise<Article[] | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const raw = await redis.get<any>(customArticlesKey(userId))
    if (!raw) return null
    if (typeof raw === 'string') return JSON.parse(raw) as CustomArticle[]
    return raw as CustomArticle[]
  } catch { return null }
}

export async function setCustomArticles(userId: string, articles: Article[]): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  await redis.set(customArticlesKey(userId), JSON.stringify(articles))
}

// ---- Daily Goal ----

export interface DailyGoalData {
  target: number
  record: Record<string, number>
}

function dailyGoalKey(uid: string) { return `daily:goal:${uid}` }

export async function getDailyGoalData(userId: string): Promise<DailyGoalData | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const raw = await redis.get<any>(dailyGoalKey(userId))
    if (!raw) return null
    if (typeof raw === 'string') return JSON.parse(raw) as DailyGoalData
    return raw as DailyGoalData
  } catch { return null }
}

export async function setDailyGoalData(userId: string, data: DailyGoalData): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  await redis.set(dailyGoalKey(userId), JSON.stringify(data))
}
