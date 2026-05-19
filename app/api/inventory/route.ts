import { NextRequest, NextResponse } from 'next/server'
import { getRedis, getCoins, getInventory, setInventory, getPet, setPet } from '@/lib/redis'
import type { PetData, InventoryData } from '@/lib/redis'

const HOUR_DECAY_HUNGER = 2
const HOUR_DECAY_HAPPINESS = 1

function applyDecay(pet: PetData): PetData {
  const now = Date.now()
  const last = new Date(pet.lastUpdated).getTime()
  const hours = Math.max(0, (now - last) / (1000 * 60 * 60))
  if (hours <= 0) return pet
  return {
    hunger: Math.max(0, pet.hunger - Math.floor(hours * HOUR_DECAY_HUNGER)),
    happiness: Math.max(0, pet.happiness - Math.floor(hours * HOUR_DECAY_HAPPINESS)),
    lastUpdated: new Date().toISOString(),
  }
}

function userId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}

export async function GET(request: NextRequest) {
  const uid = userId(request)
  if (!uid) return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })

  const redis = getRedis()
  if (!redis) return NextResponse.json({ error: 'Redis unavailable' }, { status: 503 })

  // Fetch all data in parallel
  const [coins, inv, pet] = await Promise.all([getCoins(uid), getInventory(uid), getPet(uid)])

  return NextResponse.json({
    coins,
    inventory: inv || { food: {}, accessories: {}, equipped: [] },
    pet: pet ? applyDecay(pet) : null,
  })
}

export async function POST(request: NextRequest) {
  const uid = userId(request)
  if (!uid) return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })

  const redis = getRedis()
  if (!redis) return NextResponse.json({ error: 'Redis unavailable' }, { status: 503 })

  try {
    const body = await request.json()
    const { inventory, pet } = body

    if (inventory) {
      await setInventory(uid, inventory as InventoryData)
    }
    if (pet) {
      await setPet(uid, pet as PetData)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
}
