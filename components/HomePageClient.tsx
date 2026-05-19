'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'
import { getDailyGoal, getTodayProgress, isCheckedInToday, getCheckInData } from '@/lib/checkin'
import { getMasteredCount, getTotalWordsCount, getDueReviewCount } from '@/lib/words'

interface HomePageClientProps {
  totalArticles: number
}

export default function HomePageClient({ totalArticles }: HomePageClientProps) {
  const { t, locale } = useTranslation()
  const [goal, setGoal] = useState(10)
  const [progress, setProgress] = useState({ done: 0, goal: 10 })
  const [checkedIn, setCheckedIn] = useState(false)
  const [streak, setStreak] = useState(0)
  const [mastered, setMastered] = useState(0)
  const [totalWords, setTotalWords] = useState(0)
  const [dueReviews, setDueReviews] = useState(0)

  useEffect(() => {
    setGoal(getDailyGoal())
    setProgress(getTodayProgress())
    setCheckedIn(isCheckedInToday())
    setStreak(getCheckInData().currentStreak)
    setMastered(getMasteredCount())
    setTotalWords(getTotalWordsCount())
    setDueReviews(getDueReviewCount())
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
      {/* Header */}
      <div className="text-center mb-10 md:mb-14">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          🐼 {locale === 'zh' ? '熊猫汉语' : 'Panda Chinese'}
        </h1>
        <p className="text-gray-500 text-base">
          {locale === 'zh' ? '让海外孩子爱上中文' : 'Helping kids around the world learn Chinese'}
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
    </div>
  )
}
