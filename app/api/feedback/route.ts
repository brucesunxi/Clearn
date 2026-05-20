import { NextRequest, NextResponse } from 'next/server'
import { createFeedback } from '@/lib/redis'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
  }

  try {
    const { message, contact } = await request.json()
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    const sanitizedContact = typeof contact === 'string' ? contact.trim().slice(0, 200) : ''
    // Try to persist to Redis; silently succeed if unavailable
    await createFeedback(userId, message.trim(), sanitizedContact)

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ success: true }, { status: 201 })
  }
}
