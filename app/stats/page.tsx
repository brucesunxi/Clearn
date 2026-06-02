'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'
import { getMasteredCount, getTotalWordsCount, getDueReviewCount, getStageDistribution } from '@/lib/words'
import { getCheckInData } from '@/lib/checkin'
import CheckInCalendar from '@/components/CheckInCalendar'
import { useAuth } from '@/lib/auth-context'
import TrialBanner from '@/components/TrialBanner'

export default function StatsPage() {
  const { locale } = useTranslation()
  const { user, loading } = useAuth()
  const [mastered, setMastered] = useState(0)
  const [total, setTotal] = useState(0)
  const [due, setDue] = useState(0)
  const [stageDist, setStageDist] = useState<Record<number, number>>({})
  const [streak, setStreak] = useState(0)
  const [showCalendar, setShowCalendar] = useState(false)
  const [bannerType, setBannerType] = useState<'register' | 'verify' | null>(null)

  useEffect(() => {
    setMastered(getMasteredCount())
    setTotal(getTotalWordsCount())
    setDue(getDueReviewCount())
    setStageDist(getStageDistribution())
    setStreak(getCheckInData().currentStreak)
  }, [])

  const totalLearned = Object.values(stageDist).reduce((a: number, b: number) => a + b, 0)
  const accuracy = total > 0 ? Math.round((mastered / total) * 100) : 0

  const stageLabels: Record<string, string> = {
    '0': locale === 'zh' ? '刚学' : 'New',
    '1': locale === 'zh' ? '1天' : '1 Day',
    '2': locale === 'zh' ? '2天' : '2 Days',
    '4': locale === 'zh' ? '4天' : '4 Days',
    '7': locale === 'zh' ? '7天' : '7 Days',
    '15': locale === 'zh' ? '15天' : '15 Days',
    '30': locale === 'zh' ? '30天' : '30 Days',
    '90': locale === 'zh' ? '90天' : '90 Days',
  }

  // 登录检查
  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        📊 {locale === 'zh' ? '学习统计' : 'Learning Stats'}
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{total}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{locale === 'zh' ? '总词汇' : 'Total Words'}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{mastered}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{locale === 'zh' ? '已掌握' : 'Mastered'}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-amber-600">{due}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{locale === 'zh' ? '待复习' : 'To Review'}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-violet-600">{accuracy}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{locale === 'zh' ? '掌握率' : 'Mastery'}</p>
        </div>
      </div>

      {/* Ebbinghaus stage distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 mb-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">🧠 {locale === 'zh' ? '记忆阶段分布' : 'Memory Stage Distribution'}</h2>
        {totalLearned === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            {locale === 'zh' ? '开始学习后，这里会显示你的记忆进度' : 'Start learning to see your memory progress'}
          </p>
        ) : (
          <div className="space-y-2">
            {Object.entries(stageLabels).map(([stage, label]) => {
              const count = stageDist[Number(stage)] || 0
              const pct = totalLearned > 0 ? (count / totalLearned) * 100 : 0
              const colors = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-yellow-400', 'bg-lime-400', 'bg-green-400', 'bg-emerald-400', 'bg-teal-400']
              return (
                <div key={stage} className="flex items-center gap-2 text-xs">
                  <span className="w-12 text-gray-500 dark:text-gray-400 text-right">{label}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4">
                    <div className={`h-4 rounded-full transition-all ${colors[parseInt(stage)] || 'bg-blue-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-gray-600 dark:text-gray-300 font-medium">{count}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Streak + Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 mb-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">🔥 {locale === 'zh' ? '学习连续' : 'Learning Streak'}</h2>
        <p className="text-3xl font-bold text-orange-500 mb-3">{streak} {locale === 'zh' ? '天' : 'days'}</p>
        <button onClick={() => setShowCalendar(!showCalendar)}
          className="text-xs text-blue-500 hover:text-blue-600 font-medium">
          {showCalendar ? '▾' : '▸'} {locale === 'zh' ? '查看打卡日历' : 'View Calendar'}
        </button>
        {showCalendar && <div className="mt-3"><CheckInCalendar /></div>}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/learn" className="block bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl p-4 text-center font-medium hover:from-emerald-600 hover:to-green-700 transition-all shadow-sm">
          📝 {locale === 'zh' ? '继续学习' : 'Keep Learning'}
        </Link>
        <Link href="/practice" className="block bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-4 text-center font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm">
          🎯 {locale === 'zh' ? '练习测试' : 'Practice Quiz'}
        </Link>
      </div>

      {/* 引导 */}
      {bannerType && (
        <TrialBanner type={bannerType} onClose={() => setBannerType(null)} />
      )}
      {!user && (
        <div className="mt-6">
          <TrialBanner type="register" />
        </div>
      )}
      {user && !user.emailVerified && (
        <div className="mt-6">
          <TrialBanner type="verify" />
        </div>
      )}
    </div>
  )
}
