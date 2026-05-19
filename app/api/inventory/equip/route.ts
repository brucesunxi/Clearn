import { NextRequest, NextResponse } from 'next/server'
import { getRedis, getInventory, setInventory } from '@/lib/redis'
import type { InventoryData } from '@/lib/redis'

function userId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}

export async function POST(request: NextRequest) {
  const uid = userId(request)
  if (!uid) return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })

  const redis = getRedis()
  if (!redis) return NextResponse.json({ error: 'Redis unavailable' }, { status: 503 })

  try {
    const { accessoryId } = await request.json()
    if (!accessoryId) {
      return NextResponse.json({ error: 'Invalid accessory' }, { status: 400 })
    }

    const invRaw = await getInventory(uid)
    const inv: InventoryData = invRaw || { food: {}, accessories: {}, equipped: [] }

    if (!inv.accessories[accessoryId]) {
      return NextResponse.json({ error: 'Accessory not owned' }, { status: 400 })
    }

    const newEquipped = inv.equipped.includes(accessoryId)
      ? inv.equipped.filter((id) => id !== accessoryId)
      : [...inv.equipped, accessoryId]

    const updatedInv: InventoryData = { ...inv, equipped: newEquipped }
    await setInventory(uid, updatedInv)

    return NextResponse.json({ inventory: updatedInv })
  } catch {
    return NextResponse.json({ error: 'Failed to equip' }, { status: 500 })
  }
}
