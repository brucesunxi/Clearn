import { NextRequest, NextResponse } from 'next/server'
import { markEmailVerified, getUserByVerificationToken, rewardReferrerOnVerify } from '@/lib/redis'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  // Get user before marking verified (to know who was referred)
  const userId = await getUserByVerificationToken(token)

  const ok = await markEmailVerified(token)
  if (!ok) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  // Reward referrer if this user was referred
  if (userId) {
    await rewardReferrerOnVerify(userId)
  }

  return NextResponse.json({ success: true })
}
