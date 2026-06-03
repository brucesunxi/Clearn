import { NextRequest, NextResponse } from 'next/server'
import { getEquipmentShop, buyEquipment, equipItem, getEquippedItems, getOwnedItems, calculateTotalStats } from '@/lib/adventure'
import { getUserIdFromRequest } from '@/lib/auth'

// GET - 获取装备商店和已装备物品
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const shop = getEquipmentShop()
    const equipped = await getEquippedItems(userId)
    const owned = await getOwnedItems(userId)
    const stats = await calculateTotalStats(userId)

    return NextResponse.json({
      shop,
      equipped,
      owned,
      stats
    })
  } catch (error) {
    console.error('Error fetching equipment:', error)
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 })
  }
}

// POST - 购买或装备物品
export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { itemId, action } = body

    if (!itemId || !action) {
      return NextResponse.json({ error: 'Item ID and action required' }, { status: 400 })
    }

    if (action === 'buy') {
      const result = await buyEquipment(userId, itemId)

      if (!result.success) {
        return NextResponse.json({
          error: result.message,
          requires: result.requires
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        item: result.item,
        coinsLeft: result.coinsLeft,
        message: `Purchased ${result.item?.name}`
      })
    }

    if (action === 'equip' || action === 'unequip') {
      const isEquip = action === 'equip'
      const result = await equipItem(userId, itemId, isEquip)

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 })
      }

      const stats = await calculateTotalStats(userId)

      return NextResponse.json({
        success: true,
        equipped: result.equipped,
        stats,
        message: isEquip ? 'Item equipped' : 'Item unequipped'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in equipment action:', error)
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 })
  }
}
