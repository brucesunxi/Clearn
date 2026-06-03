import { NextRequest, NextResponse } from 'next/server'
import { getPetLevel, addPetExperience } from '@/lib/adventure'
import { getUserIdFromRequest } from '@/lib/auth'

// GET - 获取宠物等级信息
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const petLevel = await getPetLevel(userId)

    return NextResponse.json({
      petLevel,
      unlocks: getLevelUnlocks(petLevel.level)
    })
  } catch (error) {
    console.error('Error fetching pet level:', error)
    return NextResponse.json({ error: 'Failed to fetch pet level' }, { status: 500 })
  }
}

// POST - 添加经验（内部使用，通常由关卡完成触发）
export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { exp, source } = body

    if (!exp || exp <= 0) {
      return NextResponse.json({ error: 'Invalid experience amount' }, { status: 400 })
    }

    const result = await addPetExperience(userId, exp)

    return NextResponse.json({
      success: true,
      expGained: exp,
      newLevel: result.newLevel,
      leveledUp: result.leveledUp,
      unlocks: result.leveledUp ? getLevelUnlocks(result.newLevel) : null,
      message: result.leveledUp
        ? `Level up! Your panda is now level ${result.newLevel}`
        : `+${exp} XP from ${source || 'adventure'}`
    })
  } catch (error) {
    console.error('Error adding experience:', error)
    return NextResponse.json({ error: 'Failed to add experience' }, { status: 500 })
  }
}

function getLevelUnlocks(level: number) {
  const unlocks = []
  if (level % 5 === 0) {
    unlocks.push({ type: 'equipment_slot', description: 'New equipment slot unlocked!' })
  }
  if (level % 10 === 0) {
    unlocks.push({ type: 'theme', description: 'New adventure theme unlocked!' })
  }
  if (level === 3) {
    unlocks.push({ type: 'feature', description: 'Weapon slot unlocked!' })
  }
  if (level === 5) {
    unlocks.push({ type: 'feature', description: 'Shield slot unlocked!' })
  }
  return unlocks
}
