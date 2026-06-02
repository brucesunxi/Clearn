import { NextRequest, NextResponse } from 'next/server'
import { getRedis } from '@/lib/redis'

export async function GET() {
  const redis = getRedis()
  if (!redis) {
    return NextResponse.json({ error: 'No Redis' }, { status: 500 })
  }

  const email = 'sunxi232@hotmail.com'
  const emailKey = `user:email:${email.toLowerCase().trim()}`

  const oldUserId = await redis.get<string>(emailKey)
  await redis.del(emailKey)

  // Also verify it's gone
  const check = await redis.get<string>(emailKey)

  return NextResponse.json({
    old_mapping: oldUserId,
    mapping_deleted: check === null || check === undefined,
    message: 'Now you can register with sunxi232@hotmail.com'
  })
}
