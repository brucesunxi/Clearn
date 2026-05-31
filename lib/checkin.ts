'use client'

import { getCheckin, setCheckin, type CheckinData as RedisCheckinData } from './redis'

const STORAGE_KEY = 'chineselearn-checkin'

// 兼容旧的数据格式
export interface CheckInData {
  history: string[]
  currentStreak: number
  longestStreak: number
}

function today(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取当前用户的 userId（从 localStorage 或 auth）
function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null
  // 优先从 auth cookie 获取（需要配合 auth 系统）
  // 这里先返回 localStorage 中的匿名 ID
  return localStorage.getItem('chineselearn-user-id')
}

// 从 localStorage 读取（旧版本兼容）
export function getCheckInData(): CheckInData {
  if (typeof window === 'undefined') {
    return { history: [], currentStreak: 0, longestStreak: 0 }
  }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as CheckInData
    } catch {
      // fall through
    }
  }
  return { history: [], currentStreak: 0, longestStreak: 0 }
}

// 保存到 localStorage（旧版本兼容）
function saveCheckInData(data: CheckInData) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// 执行签到（同时更新 localStorage 和 Redis）
export async function doCheckIn(): Promise<CheckInData> {
  const data = getCheckInData()
  const t = today()
  if (data.history.includes(t)) return data

  data.history.push(t)

  // Calculate streak
  const sorted = [...data.history].sort().reverse()
  let streak = 0
  const todayDate = new Date(t)

  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(todayDate)
    expected.setDate(expected.getDate() - i)
    const expectedStr = formatDate(expected)
    if (sorted[i] === expectedStr) {
      streak++
    } else {
      break
    }
  }

  data.currentStreak = streak
  if (streak > data.longestStreak) {
    data.longestStreak = streak
  }

  // 保存到 localStorage
  saveCheckInData(data)

  // 如果已登录，同步到 Redis
  const userId = getCurrentUserId()
  if (userId) {
    try {
      await setCheckin(userId, {
        history: data.history,
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
      })
    } catch { /* ignore */ }
  }

  return data
}

export function isCheckedInToday(): boolean {
  return getCheckInData().history.includes(today())
}

export function getMonthData(year: number, month: number): { date: string; checked: boolean }[] {
  const data = getCheckInData()
  const daysInMonth = new Date(year, month, 0).getDate()
  const result: { date: string; checked: boolean }[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    result.push({
      date: dateStr,
      checked: data.history.includes(dateStr),
    })
  }

  return result
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// --- Daily goal system ---

const GOAL_KEY = 'chineselearn-dailygoal'

export interface DailyGoalData {
  target: number
  record: Record<string, number>  // date -> words completed
}

function getDailyGoalData(): DailyGoalData {
  if (typeof window === 'undefined') return { target: 10, record: {} }
  try {
    const raw = localStorage.getItem(GOAL_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { target: 10, record: {} }
}

function saveDailyGoalData(data: DailyGoalData) {
  if (typeof window === 'undefined') return
  localStorage.setItem(GOAL_KEY, JSON.stringify(data))
}

export function getDailyGoal(): number {
  return getDailyGoalData().target
}

export function setDailyGoal(n: number) {
  const data = getDailyGoalData()
  data.target = n
  saveDailyGoalData(data)
}

export function getTodayProgress(): { done: number; goal: number } {
  const data = getDailyGoalData()
  const t = today()
  return { done: data.record[t] || 0, goal: data.target }
}

export async function incrementTodayProgress(n: number): Promise<{ done: number; goal: number }> {
  const data = getDailyGoalData()
  const t = today()
  data.record[t] = (data.record[t] || 0) + n
  saveDailyGoalData(data)

  // 同步到 Redis
  const userId = getCurrentUserId()
  if (userId) {
    try {
      await import('./redis').then(m => m.setDailyGoalData(userId, data))
    } catch { /* ignore */ }
  }

  return { done: data.record[t], goal: data.target }
}

export function isGoalCompletedToday(): boolean {
  const { done, goal } = getTodayProgress()
  return done >= goal
}

// --- Migration helper ---
// 登录后调用此函数，将 localStorage 数据迁移到 Redis
export async function migrateCheckinToRedis(userId: string): Promise<void> {
  const checkinData = getCheckInData()
  const goalData = getDailyGoalData()

  try {
    await setCheckin(userId, {
      history: checkinData.history,
      currentStreak: checkinData.currentStreak,
      longestStreak: checkinData.longestStreak,
    })
    await import('./redis').then(m => m.setDailyGoalData(userId, goalData))
  } catch { /* ignore */ }
}
