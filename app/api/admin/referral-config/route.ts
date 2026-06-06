import { NextRequest, NextResponse } from 'next/server'
import { getReferralConfig, setReferralConfig, batchGenerateReferralCodes } from '@/lib/redis'

const ADMIN_KEY = process.env.ADMIN_KEY || ''

function checkAuth(request: NextRequest): boolean {
  return request.headers.get('x-admin-key') === ADMIN_KEY
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const config = await getReferralConfig()
  return NextResponse.json({ config })
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { rewardAmount } = await request.json()
    if (typeof rewardAmount !== 'number' || rewardAmount < 0 || rewardAmount > 100000) {
      return NextResponse.json({ error: 'Invalid reward amount (0-100000)' }, { status: 400 })
    }
    await setReferralConfig({ rewardAmount })
    return NextResponse.json({ success: true, config: { rewardAmount } })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { action } = await request.json()
    if (action === 'batch-generate-codes') {
      const count = await batchGenerateReferralCodes()
      return NextResponse.json({ success: true, generated: count })
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
