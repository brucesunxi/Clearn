import { NextRequest, NextResponse } from 'next/server'
import { createActivity } from '@/lib/redis'

const VALID_ACTIONS = [
  'study_complete', 'quiz_complete', 'battle_complete',
  'listen_complete', 'speak_complete', 'checkin',
  'box_open', 'pet_feed', 'shop_purchase',
  'article_read', 'material_import',
]

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    const { action, detail } = await request.json()

    if (!action || typeof action !== 'string') {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 })
    }
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const ip = getClientIp(request)

    // Try to persist to Redis; silently succeed if unavailable
    await createActivity(
      ip.slice(0, 100),
      action,
      typeof detail === 'string' ? detail.slice(0, 1000) : '',
    )

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ success: true }, { status: 201 })
  }
}
