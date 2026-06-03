import { NextRequest, NextResponse } from 'next/server'
import { getCoinHistory } from '@/lib/redis'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
  }
  // 支持 limit 参数，默认50，最大200
  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get('limit')
  let limit = 50
  if (limitParam) {
    limit = Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200)
  }
  const entries = await getCoinHistory(userId, limit)
  return NextResponse.json({ entries })
}
