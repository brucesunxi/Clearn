import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/redis'
import { verifyToken } from '@/lib/auth'

const COOKIE_NAME = 'token'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ user: null })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ user: null })
    }

    const user = await getUser(payload.userId)
    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user: { userId: user.userId, email: user.email } })
  } catch {
    return NextResponse.json({ user: null })
  }
}
