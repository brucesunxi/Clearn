import { NextRequest, NextResponse } from 'next/server'
import { getAdventureStats } from '@/lib/adventure'
import { getUserIdFromRequest } from '@/lib/auth'

// GET - 获取冒险统计
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stats = await getAdventureStats(userId)
    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching adventure stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
