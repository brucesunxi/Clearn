import { NextRequest, NextResponse } from 'next/server'
import { getUsersPaginated } from '@/lib/redis'

function checkAdmin(request: NextRequest): boolean {
  return request.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

export async function GET(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)))

  const { users, total } = await getUsersPaginated(page, pageSize)
  const list = users.map((u) => ({
    userId: u.userId,
    email: u.email,
    createdAt: u.createdAt,
    emailVerified: u.emailVerified,
  }))

  return NextResponse.json({ users: list, total })
}
