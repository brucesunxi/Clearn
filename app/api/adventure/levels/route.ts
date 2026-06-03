import { NextRequest, NextResponse } from 'next/server'
import { getAdventureLevels, getLevelById, getUnlockedLevels, startLevel, completeLevel } from '@/lib/adventure'
import { getUserIdFromRequest } from '@/lib/auth'

// GET - 获取关卡列表
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const levelId = searchParams.get('id')

    if (levelId) {
      const level = getLevelById(parseInt(levelId))
      if (!level) {
        return NextResponse.json({ error: 'Level not found' }, { status: 404 })
      }
      return NextResponse.json({ level })
    }

    const levels = await getUnlockedLevels(userId)
    return NextResponse.json({ levels })
  } catch (error) {
    console.error('Error fetching levels:', error)
    return NextResponse.json({ error: 'Failed to fetch levels' }, { status: 500 })
  }
}

// POST - 开始/完成挑战关卡
export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { levelId, action } = body

    if (!levelId) {
      return NextResponse.json({ error: 'Level ID required' }, { status: 400 })
    }

    const level = getAdventureLevels().find(l => l.id === levelId)
    if (!level) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 })
    }

    if (action === 'start') {
      const result = await startLevel(userId, levelId)

      if (!result.success) {
        return NextResponse.json({
          error: result.message,
          requires: result.requires
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        level,
        energyLeft: result.energyLeft,
        message: `Started ${level.name}`
      })
    }

    if (action === 'complete') {
      const { score, correctCount, totalCount } = body

      const result = await completeLevel(userId, levelId, {
        score: score || 0,
        correctCount: correctCount || 0,
        totalCount: totalCount || 5
      })

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        rewards: result.rewards,
        levelUp: result.levelUp,
        message: `Completed ${level.name}!`
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in level action:', error)
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 })
  }
}
