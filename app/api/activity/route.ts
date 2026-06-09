import { NextRequest, NextResponse } from 'next/server'
import { createActivity } from '@/lib/redis'
import { getUserIdFromRequest } from '@/lib/auth'

const VALID_ACTIONS = [
  'study_complete', 'quiz_complete', 'battle_complete',
  'listen_complete', 'speak_complete', 'checkin',
  'box_open', 'pet_feed', 'shop_purchase',
  'article_read', 'material_import', 'intensive_listen',
  'adventure_level_complete',
]

export async function POST(request: NextRequest) {
  try {
    const uid = await getUserIdFromRequest(request)
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, detail } = await request.json()

    if (!action || typeof action !== 'string') {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 })
    }
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await createActivity(
      uid,
      action,
      typeof detail === 'string' ? detail.slice(0, 1000) : '',
    )

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ success: true }, { status: 201 })
  }
}
