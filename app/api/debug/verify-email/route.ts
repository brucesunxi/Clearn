import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, verifyEmailByAddress } from '@/lib/redis'

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

  if (user.emailVerified) {
    return NextResponse.json({ message: 'Already verified', email: user.email, verified: true })
  }

  const ok = await verifyEmailByAddress(email)
  return NextResponse.json({
    message: ok ? 'Email verified!' : 'Verification failed',
    email: user.email,
    verified: ok
  })
}
