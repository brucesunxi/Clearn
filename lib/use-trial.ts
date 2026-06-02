'use client'

/**
 * 试用次数管理 hook
 * 记录访客在每个功能上的操作次数，登录后自动重置
 */

const TRIAL_PREFIX = 'trial:'

export function getTrialCount(feature: string): number {
  if (typeof window === 'undefined') return 0
  try {
    const val = localStorage.getItem(TRIAL_PREFIX + feature)
    return val ? parseInt(val, 10) : 0
  } catch {
    return 0
  }
}

export function incrementTrial(feature: string): number {
  const current = getTrialCount(feature)
  const next = current + 1
  try {
    localStorage.setItem(TRIAL_PREFIX + feature, String(next))
  } catch {}
  return next
}

export function resetTrials(): void {
  if (typeof window === 'undefined') return
  try {
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith(TRIAL_PREFIX)) {
        localStorage.removeItem(key)
      }
    }
  } catch {}
}

export function useTrial(feature: string, maxTrials: number): { remaining: number; canTrial: boolean; doTrial: () => number } {
  const remaining = maxTrials - getTrialCount(feature)
  return {
    remaining,
    canTrial: remaining > 0,
    doTrial: () => incrementTrial(feature),
  }
}
