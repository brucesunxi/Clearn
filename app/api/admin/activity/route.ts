import { NextRequest, NextResponse } from 'next/server'
import { getActivityEntries } from '@/lib/redis'

function checkAdmin(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-key')
  return key === process.env.ADMIN_KEY
}

export async function GET(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)))

    const result = await getActivityEntries(page, pageSize)

    return NextResponse.json(result || { entries: [], total: 0 })
  } catch {
    return NextResponse.json({ entries: [], total: 0 })
  }
}
