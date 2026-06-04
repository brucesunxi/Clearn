'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'
import { useAuth } from '@/lib/auth-context'
import { getDailyGoal, getTodayProgress, isCheckedInToday, getCheckInData } from '@/lib/checkin'
import { getMasteredCount, getTotalWordsCount, getDueReviewCount } from '@/lib/words'

const RESEND_COOLDOWN = 60 // 60 seconds

function ResendButton({ locale }: { locale: string }) {
  const [countdown, setCountdown] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  // Load countdown from localStorage on mount
  useEffect(() => {
    const savedTime = localStorage.getItem('emailResendUntil')
    if (savedTime) {
      const remaining = Math.max(0, Math.ceil((parseInt(savedTime) - Date.now()) / 1000))
      if (remaining > 0) {
        setCountdown(remaining)
      } else {
        localStorage.removeItem('emailResendUntil')
      }
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          localStorage.removeItem('emailResendUntil')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleClick = async () => {
    if (countdown > 0 || isSending) return

    setIsSending(true)
    setLastError(null)

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'same-origin'
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send')
      }

      // Success - start countdown
      const until = Date.now() + RESEND_COOLDOWN * 1000
      localStorage.setItem('emailResendUntil', until.toString())
      setCountdown(RESEND_COOLDOWN)
    } catch (e) {
      setLastError(e instanceof Error ? e.message : (locale === 'zh' ? '发送失败' : 'Send failed'))
    } finally {
      setIsSending(false)
    }
  }

  const getButtonText = () => {
    if (isSending) return locale === 'zh' ? '发送中...' : 'Sending...'
    if (countdown > 0) return locale === 'zh' ? `重新发送 (${countdown}s)` : `Resend (${countdown}s)`
    if (lastError) return locale === 'zh' ? '发送失败，重试' : 'Failed, retry'
    return locale === 'zh' ? '重新发送' : 'Resend'
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={countdown > 0 || isSending}
        className="mt-2 px-3 py-1 text-xs rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-amber-800 dark:text-amber-300 transition-colors"
      >
        {getButtonText()}
      </button>
      {lastError && (
        <p className="mt-1 text-xs text-red-500">{lastError}</p>
      )}
    </div>
  )
}

interface HomePageClientProps {
  totalArticles: number
}

export default function HomePageClient({ totalArticles }: HomePageClientProps) {
  const { t, locale } = useTranslation()
  const { user } = useAuth()
  const [goal, setGoal] = useState(10)
  const [progress, setProgress] = useState({ done: 0, goal: 10 })
  const [checkedIn, setCheckedIn] = useState(false)
  const [streak, setStreak] = useState(0)
  const [mastered, setMastered] = useState(0)
  const [totalWords, setTotalWords] = useState(0)
  const [dueReviews, setDueReviews] = useState(0)

  useEffect(() => {
    // 未登录时显示默认空状态
    if (!user) {
      setGoal(10)
      setProgress({ done: 0, goal: 10 })
      setCheckedIn(false)
      setStreak(0)
      setMastered(0)
      setTotalWords(0)
      setDueReviews(0)
      return
    }

    // 已登录时加载真实数据
    setGoal(getDailyGoal())
    setProgress(getTodayProgress())
    setCheckedIn(isCheckedInToday())
    setStreak(getCheckInData().currentStreak)
    setMastered(getMasteredCount())
    setTotalWords(getTotalWordsCount())
    setDueReviews(getDueReviewCount())
  }, [user])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
      {/* Header */}
      <div className="text-center mb-10 md:mb-14">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          🐼 {locale === 'zh' ? '熊猫汉语' : 'Panda Chinese'}
        </h1>
        <p className="text-gray-500 text-base leading-relaxed">
          {locale === 'zh'
            ? '菲律宾、马来西亚华人免费中文自学工具，自主刷题练习，无真人课程'
            : 'Free Chinese self-study tool for overseas children. Practice vocabulary, reading, and listening with gamified exercises.'}
          <br />
          <span className="text-xs text-gray-400 mt-1 inline-block">
            {locale === 'zh' ? '📚 自学 · 练习 · 刷题 · 阅读 · 游戏化' : '📚 Self-study · Practice · Drills · Reading · Games'}
          </span>
        {/* Email verification reminder */}
        {user && !user.emailVerified && (
          <div className="max-w-lg mx-auto mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400">
            <p className="font-medium">📧 {locale === 'zh' ? '请验证您的邮箱' : 'Verify your email'}</p>
            <p className="text-xs mt-1">
              {locale === 'zh'
                ? '请检查收件箱（包括垃圾邮件），点击验证链接完成注册。如果没收到可点击重新发送。'
                : 'Check your inbox (and spam) and click the verification link.'}
            </p>
            <ResendButton locale={locale} />
          </div>
        )}

        </p>
      </div>

      {/* Three cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">

        {/* Word Memorization Card */}
        <Link href="/learn"
          className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📝</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{t('home.wordMem')}</h2>
              <p className="text-xs text-gray-400">{t('home.wordMemDesc')}</p>
            </div>
          </div>

          {/* Daily progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{t('wordmem.todayProgress')}</span>
              <span>{progress.done}/{progress.goal}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((progress.done / Math.max(progress.goal, 1)) * 100, 100)}%` }} />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
            <span>🔥 {t('wordmem.streak', { n: streak })}</span>
            <span>✅ {checkedIn ? t('wordmem.checkedIn') : t('wordmem.checkIn')}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-emerald-600">{totalWords}</div>
              <div className="text-[10px] text-emerald-500">{locale === 'zh' ? '已学' : 'Learned'}</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-amber-600">{dueReviews}</div>
              <div className="text-[10px] text-amber-500">{locale === 'zh' ? '待复习' : 'To Review'}</div>
            </div>
          </div>

          <div className="mt-auto">
            <span className="block w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium text-center group-hover:bg-emerald-600 transition-colors">
              {locale === 'zh' ? '开始学习 →' : 'Start Learning →'}
            </span>
          </div>
        </Link>

        {/* Reading Card */}
        <Link href="/reading"
          className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📖</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{t('home.reading')}</h2>
              <p className="text-xs text-gray-400">{t('home.readingDesc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-sky-50 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-sky-600">{totalArticles}</div>
              <div className="text-[10px] text-sky-500">{locale === 'zh' ? '篇文章' : 'Articles'}</div>
            </div>
            <div className="bg-violet-50 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-violet-600">{mastered}</div>
              <div className="text-[10px] text-violet-500">{locale === 'zh' ? '已掌握词' : 'Mastered'}</div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-4 flex-1">
            {locale === 'zh' ? '分级文章，适合各个水平。点击可查单词、加入学习列表。' : 'Leveled articles for all levels. Tap words to look them up.'}
          </p>

          <div className="mt-auto">
            <span className="block w-full py-2.5 rounded-xl bg-sky-500 text-white text-sm font-medium text-center group-hover:bg-sky-600 transition-colors">
              {locale === 'zh' ? '开始阅读 →' : 'Start Reading →'}
            </span>
          </div>
        </Link>

        {/* Listening & Speaking Card */}
        <Link href="/practice"
          className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🎧</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{t('home.listenSpeak')}</h2>
              <p className="text-xs text-gray-400">{t('home.listenSpeakDesc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-rose-50 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-rose-500">🎧</div>
              <div className="text-[10px] text-rose-400">{locale === 'zh' ? '听力' : 'Listen'}</div>
            </div>
            <div className="bg-red-50 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-red-500">🗣️</div>
              <div className="text-[10px] text-red-400">{locale === 'zh' ? '口语' : 'Speak'}</div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-4 flex-1">
            {locale === 'zh' ? '听单词选意思，看单词开口说。语音识别帮你纠正发音。' : 'Listen to words, choose meaning. Speak aloud with voice recognition.'}
          </p>

          <div className="mt-auto">
            <span className="block w-full py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium text-center group-hover:bg-rose-600 transition-colors">
              {locale === 'zh' ? '开始练习 →' : 'Start Practice →'}
            </span>
          </div>
        </Link>
      </div>

      {/* DIY Import Section */}
      <Link href="/import"
        className="group mt-8 block bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Icon */}
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
            ✨
          </div>

          {/* Content */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              {locale === 'zh' ? '🧩 自制学习素材' : '🧩 DIY Learning Materials'}
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              {locale === 'zh'
                ? '粘贴中文文本或上传 .txt 文件，自动分析词汇、生成拼音，创建专属学习文章。素材自动应用到阅读、单词记忆、听力口语所有模块！'
                : 'Paste Chinese text or upload a .txt file. Auto-extract vocabulary, generate pinyin, and create your own articles — usable across Reading, Word Memorization, Listening & Speaking!'}
            </p>

            {/* Steps */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-600 font-medium">📝 {locale === 'zh' ? '粘贴文本' : 'Paste text'}</span>
              <span className="text-gray-300 text-lg">→</span>
              <span className="px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-600 font-medium">🔍 {locale === 'zh' ? '自动分析' : 'Auto-analyze'}</span>
              <span className="text-gray-300 text-lg">→</span>
              <span className="px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-600 font-medium">📖 {locale === 'zh' ? '生成文章' : 'Create article'}</span>
              <span className="text-gray-300 text-lg">→</span>
              <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-100 to-sky-100 text-emerald-600 font-medium">🎯 {locale === 'zh' ? '全模块使用' : 'All modules'}</span>
            </div>
          </div>

          {/* CTA */}
          <div className="shrink-0">
            <span className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-sm group-hover:shadow-md group-hover:from-indigo-600 group-hover:to-purple-700 transition-all duration-300">
              📥 {locale === 'zh' ? '开始导入' : 'Import Now'}
            </span>
          </div>
        </div>
      </Link>

      {/* Adventure Section */}
      <Link href="/adventure"
        className="group mt-8 block bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
            🎮
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              {locale === 'zh' ? '🗺️ 熊猫冒险闯关' : '🗺️ Panda Adventure'}
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              {locale === 'zh'
                ? '四种迷你游戏合集！在知识问答、汉字谜题、迷宫探险、熊猫对战中巩固中文。闯关赢金币、升级装备、提升熊猫等级！'
                : 'Four mini-games in one! Quiz, puzzle, maze, and battle — all designed to make Chinese learning an adventure. Earn coins, equip gear, level up!'}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-600 font-medium">🎯 {locale === 'zh' ? '知识问答' : 'Quiz'}</span>
              <span className="text-gray-300 text-lg">·</span>
              <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-600 font-medium">🧩 {locale === 'zh' ? '汉字谜题' : 'Puzzle'}</span>
              <span className="text-gray-300 text-lg">·</span>
              <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-600 font-medium">🌀 {locale === 'zh' ? '迷宫探险' : 'Maze'}</span>
              <span className="text-gray-300 text-lg">·</span>
              <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-600 font-medium">⚔️ {locale === 'zh' ? '熊猫对战' : 'Battle'}</span>
              <span className="text-gray-300 text-lg">|</span>
              <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-600 font-medium">🪙 {locale === 'zh' ? '赢金币' : 'Win Coins'}</span>
            </div>
          </div>
          <div className="shrink-0">
            <span className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium shadow-sm group-hover:shadow-md group-hover:from-emerald-600 group-hover:to-teal-700 transition-all duration-300">
              🗺️ {locale === 'zh' ? '开始冒险' : 'Start Adventure'}
            </span>
          </div>
        </div>
      </Link>

      {/* AI Battle Section */}
      <Link href="/ai-battle"
        className="group mt-8 block bg-gradient-to-br from-orange-50 via-white to-amber-50 rounded-2xl border-2 border-orange-200 hover:border-orange-400 p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
            ⚔️
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              {locale === 'zh' ? '🎮 AI 单词对战' : '🎮 AI Word Battle'}
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              {locale === 'zh'
                ? '和 AI 比拼词汇！选择简单/中等/困难三个级别的 AI 对手，比正确率、比速度，综合评分决出胜负！'
                : 'Battle AI with Chinese vocabulary! Choose Easy/Medium/Hard AI, compete on accuracy and speed, and see who wins!'}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-full bg-orange-100 text-orange-600 font-medium">🐣 {locale === 'zh' ? '简单' : 'Easy'}</span>
              <span className="text-gray-300 text-lg">→</span>
              <span className="px-3 py-1.5 rounded-full bg-orange-100 text-orange-600 font-medium">🤖 {locale === 'zh' ? '中等' : 'Medium'}</span>
              <span className="text-gray-300 text-lg">→</span>
              <span className="px-3 py-1.5 rounded-full bg-orange-100 text-orange-600 font-medium">🧠 {locale === 'zh' ? '困难' : 'Hard'}</span>
            </div>
          </div>
          <div className="shrink-0">
            <span className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium shadow-sm group-hover:shadow-md group-hover:from-orange-600 group-hover:to-red-600 transition-all duration-300">
              ⚔️ {locale === 'zh' ? '开始对战' : 'Battle Now'}
            </span>
          </div>
        </div>
      </Link>

      {/* Blind Box Section */}
      <Link href="/blindbox"
        className="group mt-8 block bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border-2 border-purple-200 hover:border-purple-400 p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
            🎁
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              {locale === 'zh' ? '🎲 神秘盲盒' : '🎲 Mystery Box'}
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              {locale === 'zh'
                ? '花费 100 金币试试手气！有机会抽到宠物食物、饰品，还有概率获得大礼包！'
                : 'Spend 100 coins to try your luck! Win pet food, accessories, or rare grand prizes!'}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-600 font-medium">🎋🥟🍙 {locale === 'zh' ? '食物' : 'Food'}</span>
              <span className="text-gray-300 text-lg">·</span>
              <span className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-600 font-medium">🧣🎀👓 {locale === 'zh' ? '饰品' : 'Accessories'}</span>
              <span className="text-gray-300 text-lg">·</span>
              <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-600 font-medium">🎉 {locale === 'zh' ? '大礼包' : 'Grand Prize'}</span>
            </div>
          </div>
          <div className="shrink-0">
            <span className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium shadow-sm group-hover:shadow-md group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">
              🎁 {locale === 'zh' ? '试试手气' : 'Try Luck'}
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}
