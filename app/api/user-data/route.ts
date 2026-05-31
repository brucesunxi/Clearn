import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth'
import {
  getCheckin,
  setCheckin,
  getWordsProgress,
  setWordsProgress,
  getReadingLimit,
  setReadingLimit,
  getImportLimit,
  setImportLimit,
  getCustomArticles,
  setCustomArticles,
  getDailyGoalData,
  setDailyGoalData,
  getPet,
  setPet,
  getInventory,
  setInventory,
} from '@/lib/redis'

// 数据类型映射
const DATA_GETTERS: Record<string, (userId: string) => Promise<any>> = {
  'chineselearn-checkin': getCheckin,
  'chineselearn-words': getWordsProgress,
  'daily_reading_count': getReadingLimit,
  'daily_import_count': getImportLimit,
  'pandahan-custom-articles': getCustomArticles,
  'chineselearn-dailygoal': getDailyGoalData,
  'panda-pet': getPet,
  'panda-inventory': getInventory,
}

const DATA_SETTERS: Record<string, (userId: string, data: any) => Promise<void>> = {
  'chineselearn-checkin': setCheckin,
  'chineselearn-words': setWordsProgress,
  'daily_reading_count': setReadingLimit,
  'daily_import_count': setImportLimit,
  'pandahan-custom-articles': setCustomArticles,
  'chineselearn-dailygoal': setDailyGoalData,
  'panda-pet': setPet,
  'panda-inventory': setInventory,
}

// GET - 获取用户数据
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const key = request.nextUrl.searchParams.get('key')
  if (!key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 })
  }

  const getter = DATA_GETTERS[key]
  if (!getter) {
    return NextResponse.json({ error: 'Unknown key' }, { status: 400 })
  }

  try {
    const data = await getter(userId)
    return NextResponse.json({ data })
  } catch (e) {
    console.error('Error getting user data:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - 保存用户数据
export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { key, data } = await request.json()
    if (!key) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 })
    }

    const setter = DATA_SETTERS[key]
    if (!setter) {
      return NextResponse.json({ error: 'Unknown key' }, { status: 400 })
    }

    await setter(userId, data)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Error saving user data:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
