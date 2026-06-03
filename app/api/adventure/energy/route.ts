import { NextRequest, NextResponse } from 'next/server'
import { getEnergy, updateEnergy, calculateNaturalRegen, gainEnergyFromActivity } from '@/lib/adventure'
import { spendCoins, getCoins, addCoinHistory } from '@/lib/redis'
import { getUserIdFromRequest } from '@/lib/auth'

// GET - 获取当前能量
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const energy = await getEnergy(userId)
    const regained = await calculateNaturalRegen(userId)

    return NextResponse.json({
      energy,
      regained,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching energy:', error)
    return NextResponse.json({ error: 'Failed to fetch energy' }, { status: 500 })
  }
}

// POST - 更新能量（用于学习活动恢复）
export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { activity, amount, action } = body

    // Recharge action - buy energy with coins
    if (action === 'recharge') {
      const ENERGY_PER_POTION = 30
      const COST_PER_POTION = 30

      const balance = await getCoins(userId)
      if (balance < COST_PER_POTION) {
        return NextResponse.json({
          error: 'Not enough coins',
          requires: { coins: COST_PER_POTION - balance }
        }, { status: 400 })
      }

      const spendResult = await spendCoins(userId, COST_PER_POTION)
      if (!spendResult.success) {
        return NextResponse.json({ error: 'Transaction failed' }, { status: 400 })
      }

      const energy = await updateEnergy(userId, ENERGY_PER_POTION)

      return NextResponse.json({
        success: true,
        energy,
        gained: ENERGY_PER_POTION,
        balance: spendResult.balance,
        message: `Bought ${ENERGY_PER_POTION} energy for ${COST_PER_POTION} coins`
      })
    }

    if (!activity) {
      return NextResponse.json({ error: 'Activity type required' }, { status: 400 })
    }

    const energyGain = amount || gainEnergyFromActivity(activity)

    if (energyGain <= 0) {
      return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 })
    }

    const energy = await updateEnergy(userId, energyGain)

    return NextResponse.json({
      success: true,
      energy,
      gained: energyGain,
      activity,
      message: `Energy +${energyGain} from ${activity}`
    })
  } catch (error) {
    console.error('Error updating energy:', error)
    return NextResponse.json({ error: 'Failed to update energy' }, { status: 500 })
  }
}
