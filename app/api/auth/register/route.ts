import { NextRequest, NextResponse } from 'next/server'
import { createUser, setVerificationToken } from '@/lib/redis'
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/mail'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Get existing anonymous userId if any
    const existingUserId = request.headers.get('x-user-id') || ''
    const userId = existingUserId || `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

    const passwordHash = await hashPassword(password)
    const created = await createUser(userId, normalizedEmail, passwordHash)

    if (!created) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Generate verification token and send verification email
    const buf = new Uint8Array(32)
    crypto.getRandomValues(buf)
    const verToken = Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('')
    await setVerificationToken(userId, verToken)
    const emailSent = await sendVerificationEmail(normalizedEmail, verToken).catch((e) => {
      console.error('Failed to send verification email:', e)
      return false
    })

    const jwt = await signToken(userId)
    const response = NextResponse.json({ success: true, userId, emailVerified: false, emailSent })
    setAuthCookie(response, jwt)

    return response
  } catch (e) {
    console.error('Register error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
