import { NextRequest, NextResponse } from 'next/server'
import { getReferralStats, getUser } from '@/lib/redis'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const stats = await getReferralStats(userId)
    const user = await getUser(userId)
    return NextResponse.json({
      stats,
      email: user?.email || '',
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
