import { NextRequest, NextResponse } from 'next/server'
import { getUser, setVerificationToken } from '@/lib/redis'
import { verifyToken } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/mail'

const COOKIE_NAME = 'token'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const user = await getUser(payload.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Already verified' }, { status: 400 })
    }

    const buf = new Uint8Array(32)
    crypto.getRandomValues(buf)
    const verToken = Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('')
    await setVerificationToken(user.userId, verToken)

    const sent = await sendVerificationEmail(user.email, verToken)
    if (!sent) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
