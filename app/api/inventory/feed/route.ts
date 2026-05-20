import { NextRequest, NextResponse } from 'next/server'
import { getRedis, getCoinsKey, getInventory, setInventory, getPet, setPet } from '@/lib/redis'
import type { InventoryData, PetData } from '@/lib/redis'
import { getUserIdFromRequest } from '@/lib/auth'

const FOOD_ITEMS: Record<string, { hunger: number; happiness: number }> = {
  bamboo: { hunger: 30, happiness: 5 },
  rice: { hunger: 20, happiness: 0 },
  dumpling: { hunger: 25, happiness: 10 },
  cake: { hunger: 15, happiness: 20 },
  milk: { hunger: 10, happiness: 15 },
}

export async function POST(request: NextRequest) {
  const uid = await getUserIdFromRequest(request)
  if (!uid) return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })

  const redis = getRedis()
  if (!redis) return NextResponse.json({ error: 'Redis unavailable' }, { status: 503 })

  try {
    const { foodId } = await request.json()
    if (!foodId || !FOOD_ITEMS[foodId]) {
      return NextResponse.json({ error: 'Invalid food' }, { status: 400 })
    }

    const [invRaw, petRaw] = await Promise.all([getInventory(uid), getPet(uid)])

    const inv: InventoryData = invRaw || { food: {}, accessories: {}, equipped: [] }
    const qty = inv.food[foodId] || 0
    if (qty <= 0) {
      return NextResponse.json({ error: 'Not enough food' }, { status: 400 })
    }

    // Apply food effect
    const effect = FOOD_ITEMS[foodId]
    const pet: PetData = petRaw || { hunger: 50, happiness: 50, lastUpdated: new Date().toISOString() }
    const now = new Date().toISOString()
    const updatedPet: PetData = {
      hunger: Math.min(100, pet.hunger + effect.hunger),
      happiness: Math.min(100, pet.happiness + effect.happiness),
      lastUpdated: now,
    }

    // Deduct food
    const newFood = { ...inv.food }
    newFood[foodId] = qty - 1
    const updatedInv: InventoryData = { ...inv, food: newFood }

    await Promise.all([setInventory(uid, updatedInv), setPet(uid, updatedPet)])

    return NextResponse.json({ pet: updatedPet, inventory: updatedInv })
  } catch {
    return NextResponse.json({ error: 'Failed to feed' }, { status: 500 })
  }
}
