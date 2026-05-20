import { NextRequest, NextResponse } from 'next/server'
import { getFeedbackEntries, markFeedbackRead, deleteFeedback } from '@/lib/redis'

function checkAdmin(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-key')
  return key === process.env.ADMIN_KEY
}

export async function GET(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)))

  const result = await getFeedbackEntries(page, pageSize)
  if (!result) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  return NextResponse.json(result)
}

export async function PATCH(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    const ok = await markFeedbackRead(id)
    if (!ok) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    await deleteFeedback(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
