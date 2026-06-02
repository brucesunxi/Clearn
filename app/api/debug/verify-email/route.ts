import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail } from '@/lib/redis'

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')
  if (key !== 'fix123') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const email = 'sunxi232@hotmail.com'
  const user = await getUserByEmail(email)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    email: user.email,
    userId: user.userId,
    emailVerified: user.emailVerified,
    already_verified: user.emailVerified,
  })
}
