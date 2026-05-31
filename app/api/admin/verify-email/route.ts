import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailByAddress } from '@/lib/redis'

const ADMIN_KEY = process.env.ADMIN_KEY

export async function POST(request: NextRequest) {
  try {
    // Check admin key from header
    const adminKey = request.headers.get('x-admin-key')
    if (!ADMIN_KEY || adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const success = await verifyEmailByAddress(email)
    if (!success) {
      return NextResponse.json({ error: 'User not found or verification failed' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: `Email ${email} verified` })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
