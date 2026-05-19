import { NextRequest, NextResponse } from 'next/server'
import { getCoins, addCoins } from '@/lib/redis'

function getUserId(request: NextRequest): string | null {
  return request.headers.get('x-user-id') || null
}

export async function GET(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
  }
  const balance = await getCoins(userId)
  return NextResponse.json({ balance })
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
  }

  try {
    const { amount } = await request.json()
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }
    const balance = await addCoins(userId, amount)
    return NextResponse.json({ balance })
  } catch {
    return NextResponse.json({ error: 'Failed to add coins' }, { status: 500 })
  }
}
