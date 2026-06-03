import { NextRequest, NextResponse } from 'next/server'
import { getRedis, getCheckin, setCheckin, addCoins, addCoinHistory } from '@/lib/redis'
import { updateEnergy } from '@/lib/adventure'
import { getUserIdFromRequest } from '@/lib/auth'

function today(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function GET(request: NextRequest) {
  const uid = await getUserIdFromRequest(request)
  if (!uid) return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })

  const data = await getCheckin(uid)
  return NextResponse.json({
    checkin: data || { history: [], currentStreak: 0, longestStreak: 0 },
    checkedInToday: data ? data.history.includes(today()) : false,
  })
}

export async function POST(request: NextRequest) {
  const uid = await getUserIdFromRequest(request)
  if (!uid) return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })

  const redis = getRedis()
  if (!redis) return NextResponse.json({ error: 'Redis unavailable' }, { status: 503 })

  let data = await getCheckin(uid)
  if (!data) {
    data = { history: [], currentStreak: 0, longestStreak: 0 }
  }

  const t = today()
  if (data.history.includes(t)) {
    return NextResponse.json({ checkin: data, checkedInToday: true })
  }

  data.history.push(t)

  // Calculate streak
  const sorted = [...data.history].sort().reverse()
  let streak = 0
  const todayDate = new Date(t)
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(todayDate)
    expected.setDate(expected.getDate() - i)
    if (sorted[i] === formatDate(expected)) {
      streak++
    } else {
      break
    }
  }

  data.currentStreak = streak
  if (streak > data.longestStreak) {
    data.longestStreak = streak
  }

  await setCheckin(uid, data)

  // Reward 20 coins for check-in
  const coins = await addCoins(uid, 20)
  addCoinHistory(uid, 20, 'checkin', coins, 'streak ' + data.currentStreak + ' days')

  // Restore 20 adventure energy on check-in
  const energy = await updateEnergy(uid, 20)

  return NextResponse.json({ checkin: data, checkedInToday: true, coins, energy })
}
