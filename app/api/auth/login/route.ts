import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, getCoins, addCoins, addCoinHistory } from '@/lib/redis'
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await getUserByEmail(normalizedEmail)
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = await signToken(user.userId)

    // 迁移匿名金币到注册账号（处理注册前攒的金币）
    const anonId = request.headers.get('x-user-id')
    if (anonId && anonId.startsWith('anon-') && anonId !== user.userId) {
      try {
        const anonCoins = await getCoins(anonId)
        if (anonCoins > 500) {
          const migratedCoins = anonCoins - 500
          await addCoins(user.userId, migratedCoins)
          await addCoinHistory(user.userId, migratedCoins, 'earn', await getCoins(user.userId), `Migrated from anonymous account`)
        }
      } catch {
        // non-critical
      }
    }

    const response = NextResponse.json({ success: true, userId: user.userId })
    setAuthCookie(response, token)

    return response
  } catch (e) {
    console.error('Login error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
