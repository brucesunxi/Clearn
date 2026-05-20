import { NextRequest, NextResponse } from 'next/server'
import { createFeedback } from '@/lib/redis'

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    const { message, contact } = await request.json()
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    const ip = getClientIp(request)
    const sanitizedContact = typeof contact === 'string' ? contact.trim().slice(0, 200) : ''
    await createFeedback(ip, message.trim(), sanitizedContact)

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ success: true }, { status: 201 })
  }
}
