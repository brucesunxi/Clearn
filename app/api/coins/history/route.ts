import { NextRequest, NextResponse } from 'next/server'
import { getCoinHistory } from '@/lib/redis'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
  }
  const entries = await getCoinHistory(userId)
  return NextResponse.json({ entries })
}
