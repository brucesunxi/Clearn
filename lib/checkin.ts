'use client'

const STORAGE_KEY = 'chineselearn-checkin'

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

export function doCheckIn(): CheckInData {
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

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
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

export function incrementTodayProgress(n: number): { done: number; goal: number } {
  const data = getDailyGoalData()
  const t = today()
  data.record[t] = (data.record[t] || 0) + n
  saveDailyGoalData(data)
  return { done: data.record[t], goal: data.target }
}

export function isGoalCompletedToday(): boolean {
  const { done, goal } = getTodayProgress()
  return done >= goal
}
