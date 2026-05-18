'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import type { Article } from '@/lib/types'
import {
  getCheckInData, getDailyGoal, setDailyGoal,
  getTodayProgress, incrementTodayProgress, isCheckedInToday,
  doCheckIn
} from '@/lib/checkin'
import { getMasteredCount, getTotalWordsCount, getDueReviewCount } from '@/lib/words'
import CheckInCalendar from '@/components/CheckInCalendar'
import FlashcardSession from '@/components/FlashcardSession'
import QuizSession from '@/components/QuizSession'

interface LearnPageClientProps {
  articles: Article[]
}

type Mode = 'flashcard' | 'quiz'

const GOAL_OPTIONS = [5, 10, 15, 20, 25, 30]

export default function LearnPageClient({ articles }: LearnPageClientProps) {
  const { t, locale } = useTranslation()
  const [mode, setMode] = useState<Mode>('flashcard')
  const [goal, setGoalState] = useState(10)
  const [progress, setProgress] = useState({ done: 0, goal: 10 })
  const [streak, setStreak] = useState(0)
  const [checkedIn, setCheckedIn] = useState(false)
  const [mastered, setMastered] = useState(0)
  const [totalWords, setTotalWords] = useState(0)
  const [dueReviews, setDueReviews] = useState(0)
  const [showGoalPicker, setShowGoalPicker] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)

  const refreshStats = useCallback(() => {
    setGoalState(getDailyGoal())
    setProgress(getTodayProgress())
    setStreak(getCheckInData().currentStreak)
    setCheckedIn(isCheckedInToday())
    setMastered(getMasteredCount())
    setTotalWords(getTotalWordsCount())
    setDueReviews(getDueReviewCount())
  }, [])

  useEffect(() => { refreshStats() }, [refreshStats])

  const handleSetGoal = (n: number) => {
    setDailyGoal(n)
    setGoalState(n)
    setProgress(getTodayProgress())
    setShowGoalPicker(false)
  }

  const handleManualCheckIn = () => {
    doCheckIn()
    setCheckedIn(true)
    refreshStats()
  }

  const handleSessionComplete = () => {
    // Increment today's progress by session size, auto check-in
    // Note: FlashcardSession already calls doCheckIn() internally
    incrementTodayProgress(1) // signal that a session was done
    refreshStats()
    setSessionKey((k) => k + 1) // reset session so user can start fresh
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Dashboard */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              📝 {t('wordmem.title')}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              🔥 {t('wordmem.streak', { n: streak })}
            </p>
          </div>
          {checkedIn ? (
            <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-600 text-sm font-medium">
              {t('wordmem.checkedIn')}
            </span>
          ) : (
            <button
              onClick={handleManualCheckIn}
              className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
            >
              {t('wordmem.checkIn')}
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium text-gray-600">{t('wordmem.todayProgress')}</span>
            <button
              onClick={() => setShowGoalPicker(!showGoalPicker)}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {locale === 'zh' ? `目标 ${goal}` : `Goal ${goal}`} ▾
            </button>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((progress.done / Math.max(goal, 1)) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {t('wordmem.wordsToday', { n: progress.done })} · {t('wordmem.masteredCount', { n: mastered })}
          </p>
        </div>

        {/* Goal picker */}
        {showGoalPicker && (
          <div className="mb-4 flex gap-2">
            {GOAL_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => handleSetGoal(n)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  goal === n
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-emerald-600">{totalWords}</div>
            <div className="text-[10px] text-emerald-500">{t('wordmem.totalWords', { n: '' }).trim() || (locale === 'zh' ? '已学' : 'Learned')}</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-amber-600">{dueReviews}</div>
            <div className="text-[10px] text-amber-500">{locale === 'zh' ? '待复习' : 'Due Review'}</div>
          </div>
          <div className="bg-violet-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-violet-600">{mastered}</div>
            <div className="text-[10px] text-violet-500">{locale === 'zh' ? '已掌握' : 'Mastered'}</div>
          </div>
        </div>
      </div>

      {/* Check-in Calendar */}
      <div className="mb-6">
        <CheckInCalendar />
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('flashcard')}
          className={`flex-1 py-3 rounded-xl text-base font-medium transition-all ${
            mode === 'flashcard'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          📚 {locale === 'zh' ? '闪卡学习' : 'Flashcards'}
        </button>
        <button
          onClick={() => setMode('quiz')}
          className={`flex-1 py-3 rounded-xl text-base font-medium transition-all ${
            mode === 'quiz'
              ? 'bg-purple-500 text-white shadow-sm'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          🎯 {locale === 'zh' ? '单词测验' : 'Word Quiz'}
        </button>
      </div>

      {/* Learning session */}
      {mode === 'flashcard' ? (
        <FlashcardSession key={sessionKey} articles={articles} onComplete={handleSessionComplete} />
      ) : (
        <QuizSession articles={articles} />
      )}
    </div>
  )
}
