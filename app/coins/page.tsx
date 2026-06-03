'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import { useCoins } from '@/lib/use-coins'
import SiteLogo from '@/components/SiteLogo'

interface CoinHistoryEntry {
  id: string
  amount: number
  reason: string
  balance: number
  createdAt: string
  detail: string
}

type TimeFilter = 'all' | 'today' | 'week' | 'month'
type TypeFilter = 'all' | 'income' | 'expense'

const REASON_MAP: Record<string, { icon: string; label: string; labelZh: string }> = {
  study_complete: { icon: '📝', label: 'Study', labelZh: '学习' },
  quiz_complete: { icon: '🎯', label: 'Quiz', labelZh: '测验' },
  battle_complete: { icon: '⚔️', label: 'Battle', labelZh: '对战' },
  listen_complete: { icon: '🎧', label: 'Listen', labelZh: '听力' },
  speak_complete: { icon: '🗣️', label: 'Speak', labelZh: '口语' },
  checkin: { icon: '✅', label: 'Check-in', labelZh: '签到' },
  box_open: { icon: '🎁', label: 'Blind Box', labelZh: '开盲盒' },
  box_prize: { icon: '🎁', label: 'Box Prize', labelZh: '盲盒奖励' },
  pet_feed: { icon: '🍙', label: 'Feed Pet', labelZh: '喂食' },
  shop_purchase: { icon: '🛒', label: 'Purchase', labelZh: '购买' },
  spend: { icon: '💸', label: 'Spend', labelZh: '消费' },
  earn: { icon: '💰', label: 'Earn', labelZh: '获得' },
  level_complete: { icon: '🏆', label: 'Level Complete', labelZh: '通关' },
  level_revive: { icon: '💀', label: 'Revive', labelZh: '复活' },
  equipment_sell: { icon: '💎', label: 'Sell Item', labelZh: '出售装备' },
  welcome_bonus: { icon: '🎉', label: 'Welcome Bonus', labelZh: '欢迎奖励' },
}

function getReasonInfo(reason: string, locale: string) {
  const info = REASON_MAP[reason]
  if (info) {
    return { icon: info.icon, label: locale === 'zh' ? info.labelZh : info.label }
  }
  return { icon: '💰', label: reason }
}

function formatDateTime(iso: string, locale: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()

  const timeStr = d.toLocaleTimeString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (isToday) return `${locale === 'zh' ? '今天' : 'Today'} ${timeStr}`
  if (isYesterday) return `${locale === 'zh' ? '昨天' : 'Yesterday'} ${timeStr}`

  const dateStr = d.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
  })
  return `${dateStr} ${timeStr}`
}

function formatDateGroup(iso: string, locale: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()

  if (isToday) return locale === 'zh' ? '今天' : 'Today'
  if (isYesterday) return locale === 'zh' ? '昨天' : 'Yesterday'

  return d.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

export default function CoinsPage() {
  const { locale, t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const { theme, setTheme } = useTheme()
  const { balance, refresh } = useCoins()
  const [entries, setEntries] = useState<CoinHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchHistory = async () => {
      setLoading(true)
      try {
        // 获取所有历史记录（不分页，获取100条）
        const res = await fetch('/api/coins/history?limit=100', {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          setEntries(data.entries || [])
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
    refresh()
  }, [user, refresh])

  // 筛选记录
  const filteredEntries = useMemo(() => {
    let result = entries

    // 时间筛选
    if (timeFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      result = result.filter((entry) => {
        const entryDate = new Date(entry.createdAt)
        switch (timeFilter) {
          case 'today':
            return entryDate >= today
          case 'week': {
            const weekAgo = new Date(today)
            weekAgo.setDate(weekAgo.getDate() - 7)
            return entryDate >= weekAgo
          }
          case 'month': {
            const monthAgo = new Date(today)
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            return entryDate >= monthAgo
          }
          default:
            return true
        }
      })
    }

    // 类型筛选
    if (typeFilter !== 'all') {
      result = result.filter((entry) => {
        if (typeFilter === 'income') return entry.amount > 0
        if (typeFilter === 'expense') return entry.amount < 0
        return true
      })
    }

    return result
  }, [entries, timeFilter, typeFilter])

  // 统计
  const stats = useMemo(() => {
    const income = filteredEntries
      .filter((e) => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0)
    const expense = filteredEntries
      .filter((e) => e.amount < 0)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0)
    return { income, expense, net: income - expense }
  }, [filteredEntries])

  // 按日期分组
  const groupedEntries = useMemo(() => {
    const groups: Record<string, CoinHistoryEntry[]> = {}
    filteredEntries.forEach((entry) => {
      const dateKey = new Date(entry.createdAt).toDateString()
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(entry)
    })
    return groups
  }, [filteredEntries])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              {locale === 'zh' ? '请先登录' : 'Please Sign In'}
            </h2>
            <p className="text-gray-500 mb-6">
              {locale === 'zh' ? '登录后查看您的金币明细' : 'Sign in to view your coin history'}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              {locale === 'zh' ? '去登录' : 'Sign In'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <SiteLogo />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              {locale === 'zh' ? '返回首页' : 'Back to Home'}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 总余额卡片 */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 mb-6 shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">
                {locale === 'zh' ? '当前余额' : 'Current Balance'}
              </p>
              <div className="text-4xl font-bold flex items-center gap-2">
                <span>🪙</span>
                <span>{balance.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-6xl opacity-30">💰</div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {locale === 'zh' ? '收入' : 'Income'}
            </p>
            <div className="text-xl font-bold text-green-600">
              +{stats.income.toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {locale === 'zh' ? '支出' : 'Expense'}
            </p>
            <div className="text-xl font-bold text-red-500">
              -{stats.expense.toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {locale === 'zh' ? '净收益' : 'Net'}
            </p>
            <div className={`text-xl font-bold ${stats.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {stats.net >= 0 ? '+' : ''}{stats.net.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-6">
          <div className="flex flex-wrap gap-4">
            {/* 时间筛选 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {locale === 'zh' ? '时间:' : 'Time:'}
              </span>
              <div className="flex gap-1">
                {(['all', 'today', 'week', 'month'] as TimeFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      timeFilter === filter
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {filter === 'all' && (locale === 'zh' ? '全部' : 'All')}
                    {filter === 'today' && (locale === 'zh' ? '今天' : 'Today')}
                    {filter === 'week' && (locale === 'zh' ? '本周' : 'Week')}
                    {filter === 'month' && (locale === 'zh' ? '本月' : 'Month')}
                  </button>
                ))}
              </div>
            </div>

            {/* 类型筛选 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {locale === 'zh' ? '类型:' : 'Type:'}
              </span>
              <div className="flex gap-1">
                {(['all', 'income', 'expense'] as TypeFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTypeFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      typeFilter === filter
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {filter === 'all' && (locale === 'zh' ? '全部' : 'All')}
                    {filter === 'income' && (locale === 'zh' ? '收入' : 'Income')}
                    {filter === 'expense' && (locale === 'zh' ? '支出' : 'Expense')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 记录列表 */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm">
              <div className="text-gray-400">{locale === 'zh' ? '加载中...' : 'Loading...'}</div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm">
              <div className="text-4xl mb-3">📭</div>
              <div className="text-gray-500">
                {locale === 'zh' ? '暂无记录' : 'No records yet'}
              </div>
            </div>
          ) : (
            Object.entries(groupedEntries)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([dateKey, dayEntries]) => (
                <div key={dateKey} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                  {/* 日期标题 */}
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {formatDateGroup(dayEntries[0].createdAt, locale)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                      {dayEntries.length} {locale === 'zh' ? '笔' : 'entries'}
                    </span>
                  </div>

                  {/* 记录项 */}
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {dayEntries.map((entry) => {
                      const reasonInfo = getReasonInfo(entry.reason, locale)
                      const isExpanded = expandedEntry === entry.id

                      return (
                        <div
                          key={entry.id}
                          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                          onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{reasonInfo.icon}</span>
                              <div>
                                <div className="font-medium text-gray-800 dark:text-gray-200">
                                  {reasonInfo.label}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {formatDateTime(entry.createdAt, locale)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={`text-lg font-bold ${entry.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {entry.amount >= 0 ? '+' : ''}{entry.amount}
                              </div>
                              <svg
                                className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>

                          {/* 展开详情 */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">{locale === 'zh' ? '变动金额' : 'Amount'}:</span>
                                  <span className={`ml-2 font-medium ${entry.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {entry.amount >= 0 ? '+' : ''}{entry.amount}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">{locale === 'zh' ? '变动后余额' : 'Balance After'}:</span>
                                  <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">
                                    {entry.balance}
                                  </span>
                                </div>
                                {entry.detail && (
                                  <div className="col-span-2">
                                    <span className="text-gray-500 dark:text-gray-400">{locale === 'zh' ? '详情' : 'Detail'}:</span>
                                    <span className="ml-2 text-gray-700 dark:text-gray-300">{entry.detail}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
          )}
        </div>

        {/* 底部说明 */}
        <div className="mt-6 text-center text-xs text-gray-400">
          {locale === 'zh'
            ? `共 ${filteredEntries.length} 条记录 · 最多显示最近 100 条`
            : `${filteredEntries.length} entries · Showing latest 100`}
        </div>
      </main>
    </div>
  )
}
