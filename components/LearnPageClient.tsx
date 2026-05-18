'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import type { Level, Article } from '@/lib/types'
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
  levels: Level[]
  articles: Article[]
}

type Mode = 'flashcard' | 'quiz'

const GOAL_OPTIONS = [5, 10, 15, 20, 25, 30]
const BOOK_KEY = 'chineselearn-wordbook'

function getSavedBook(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(BOOK_KEY)
    if (raw === 'all') return null
    const n = parseInt(raw || '')
    return isNaN(n) ? null : n
  } catch { return null }
}

function saveBook(level: number | null) {
  if (typeof window === 'undefined') return
  localStorage.setItem(BOOK_KEY, level === null ? 'all' : String(level))
}

export default function LearnPageClient({ levels, articles }: LearnPageClientProps) {
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
  const [wordBook, setWordBook] = useState<number | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)

  const refreshStats = useCallback(() => {
    setGoalState(getDailyGoal())
    setProgress(getTodayProgress())
    setStreak(getCheckInData().currentStreak)
    setCheckedIn(isCheckedInToday())
    setMastered(getMasteredCount())
    setTotalWords(getTotalWordsCount())
    setDueReviews(getDueReviewCount())
  }, [])

  useEffect(() => {
    refreshStats()
    setWordBook(getSavedBook())
  }, [refreshStats])

  const filteredArticles = wordBook === null
    ? articles
    : articles.filter((a) => a.level === wordBook)

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
    incrementTodayProgress(1)
    refreshStats()
    setSessionKey((k) => k + 1)
  }

  const handleWordBookChange = (level: number | null) => {
    setWordBook(level)
    saveBook(level)
    setSessionKey((k) => k + 1)
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

      {/* Word book selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">
          📚 {locale === 'zh' ? '选择词书' : 'Word Book'}
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleWordBookChange(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              wordBook === null
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {locale === 'zh' ? '全部单词' : 'All Words'}
          </button>
          {levels.map((l) => (
            <button
              key={l.id}
              onClick={() => handleWordBookChange(l.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                wordBook === l.id
                  ? 'text-white shadow-sm'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
              style={wordBook === l.id ? { backgroundColor: l.color } : undefined}
            >
              {l.emoji} {locale === 'zh' ? l.name : t(`level.${l.id}.name`)}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {wordBook === null
            ? (locale === 'zh' ? `当前词库：全部文章 · ${filteredArticles.length} 篇文章` : `All articles · ${filteredArticles.length} articles`)
            : (locale === 'zh'
                ? `当前词库：${levels.find((l) => l.id === wordBook)?.name} · ${filteredArticles.length} 篇文章`
                : `Current: ${levels.find((l) => l.id === wordBook)?.name} · ${filteredArticles.length} articles`)
          }
        </p>
      </div>

      {/* Collapsible Check-in Calendar */}
      <div className="mb-6">
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
        >
          <span>{showCalendar ? '▾' : '▸'}</span>
          📅 {locale === 'zh' ? '打卡日历' : 'Check-in Calendar'}
        </button>
        {showCalendar && <CheckInCalendar />}
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
        <FlashcardSession key={sessionKey} articles={filteredArticles} onComplete={handleSessionComplete} />
      ) : (
        <QuizSession articles={filteredArticles} />
      )}
    </div>
  )
}
