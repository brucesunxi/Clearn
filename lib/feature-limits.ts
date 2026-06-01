'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'

interface UseFeatureLimitReturn {
  canUse: boolean
  usedCount: number
  limit: number
  remaining: number
  isLoading: boolean
  checkLimit: () => Promise<boolean>
}

// 功能限制配置
export const FEATURE_LIMITS = {
  reading: { limit: 3, period: 'daily', name: '阅读' },
  listen: { limit: 5, period: 'daily', name: '听力' },
  speak: { limit: 5, period: 'daily', name: '口语' },
  quiz: { limit: 10, period: 'daily', name: '测验' },
  battle: { limit: 3, period: 'daily', name: '对战' },
  blindbox: { limit: 1, period: 'weekly', name: '盲盒' },
  import: { limit: 0, period: 'never', name: '导入' }, // 仅限会员
} as const

type FeatureType = keyof typeof FEATURE_LIMITS

export function useFeatureLimit(feature: FeatureType): UseFeatureLimitReturn {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [usage, setUsage] = useState({ count: 0, date: '' })

  const config = FEATURE_LIMITS[feature]

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    // 从 localStorage 获取使用记录
    const key = `feature_limit:${feature}`
    const stored = localStorage.getItem(key)
    if (stored) {
      setUsage(JSON.parse(stored))
    }
    setIsLoading(false)
  }, [user, feature])

  const getPeriodKey = () => {
    const now = new Date()
    if (config.period === 'daily') {
      return now.toISOString().split('T')[0]
    }
    if (config.period === 'weekly') {
      const week = getWeekNumber(now)
      return `${now.getFullYear()}-W${week}`
    }
    return 'all'
  }

  const checkLimit = async (): Promise<boolean> => {
    if (!user) return false

    const periodKey = getPeriodKey()

    // 检查是否需要重置计数
    if (usage.date !== periodKey) {
      setUsage({ count: 0, date: periodKey })
      localStorage.setItem(`feature_limit:${feature}`, JSON.stringify({ count: 0, date: periodKey }))
      return true
    }

    return usage.count < config.limit
  }

  const incrementUsage = () => {
    const periodKey = getPeriodKey()
    const newCount = usage.date === periodKey ? usage.count + 1 : 1
    const newUsage = { count: newCount, date: periodKey }
    setUsage(newUsage)
    localStorage.setItem(`feature_limit:${feature}`, JSON.stringify(newUsage))
  }

  const periodKey = getPeriodKey()
  const currentCount = usage.date === periodKey ? usage.count : 0

  return {
    canUse: !!user && currentCount < config.limit,
    usedCount: currentCount,
    limit: config.limit,
    remaining: Math.max(0, config.limit - currentCount),
    isLoading,
    checkLimit,
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

// 检查用户是否可以访问特定功能
export function canAccessFeature(feature: FeatureType, user: any): boolean {
  if (!user) return false

  // 导入功能需要特殊处理（可能需要会员）
  if (feature === 'import') {
    // 暂时允许所有登录用户使用
    return true
  }

  return true // 其他功能登录即可使用
}
