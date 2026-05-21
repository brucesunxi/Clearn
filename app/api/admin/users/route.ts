import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers } from '@/lib/redis'

function checkAdmin(request: NextRequest): boolean {
  return request.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

export async function GET(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await getAllUsers()
  const list = users.map((u) => ({
    userId: u.userId,
    email: u.email,
    createdAt: u.createdAt,
    emailVerified: u.emailVerified,
  }))

  return NextResponse.json({ users: list, total: list.length })
}
