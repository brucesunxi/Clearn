import { NextRequest, NextResponse } from 'next/server'
import { getEnergy, updateEnergy, calculateNaturalRegen, gainEnergyFromActivity } from '@/lib/adventure'
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
    const { activity, amount } = body

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
