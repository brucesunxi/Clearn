import { NextRequest, NextResponse } from 'next/server'
import { spendCoins } from '@/lib/redis'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
  }

  try {
    const { amount } = await request.json()
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const result = await spendCoins(userId, amount)
    if (!result.success) {
      return NextResponse.json({ error: 'Insufficient coins', balance: result.balance }, { status: 402 })
    }

    return NextResponse.json({ balance: result.balance })
  } catch {
    return NextResponse.json({ error: 'Failed to spend coins' }, { status: 500 })
  }
}
