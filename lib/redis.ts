import { Redis } from '@upstash/redis'

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
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

export async function addCoins(userId: string, amount: number): Promise<number> {
  const redis = getRedis()
  if (!redis) return STARTING_COINS
  const current = await getCoins(userId)
  const newBalance = current + amount
  await redis.set(getCoinsKey(userId), newBalance)
  return newBalance
}

export async function spendCoins(userId: string, amount: number): Promise<{ success: boolean; balance: number }> {
  const redis = getRedis()
  if (!redis) return { success: false, balance: STARTING_COINS }
  const current = await getCoins(userId)
  if (current < amount) {
    return { success: false, balance: current }
  }
  const newBalance = current - amount
  await redis.set(getCoinsKey(userId), newBalance)
  return { success: true, balance: newBalance }
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
    const raw = await redis.get<string>(invKey(userId))
    if (!raw) return null
    return JSON.parse(raw) as InventoryData
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
    const raw = await redis.get<string>(petKey(userId))
    if (!raw) return null
    return JSON.parse(raw) as PetData
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
    const raw = await redis.get<string>(checkinKey(userId))
    if (!raw) return null
    return JSON.parse(raw) as CheckinData
  } catch { return null }
}

export async function setCheckin(userId: string, data: CheckinData): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  await redis.set(checkinKey(userId), JSON.stringify(data))
}
