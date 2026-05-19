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
