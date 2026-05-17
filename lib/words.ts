'use client'

import type { Article, VocabularyItem } from './types'

const STORAGE_KEY = 'chineselearn-words'

export interface WordProgress {
  word: string
  meaning: string
  pinyin: string
  level: number        // 0=new, 1=learning, 2=familiar, 3=mastered
  nextReview: string   // ISO date string YYYY-MM-DD
  reviewCount: number
  correctCount: number
  lastReviewDate: string
  articleId: string
}

export function getWordId(word: string, level: number, articleId: string): string {
  return `${word}_level-${level}_${articleId}`
}

function getAllProgress(): Record<string, WordProgress> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveAllProgress(data: Record<string, WordProgress>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Build a complete word database from all articles, deduplicated
export function buildWordDatabase(articles: Article[]): Map<string, { word: VocabularyItem; articleId: string; level: number }> {
  const db = new Map<string, { word: VocabularyItem; articleId: string; level: number }>()

  for (const article of articles) {
    for (const v of article.vocabulary) {
      const key = `${v.word}_level-${article.level}`
      if (!db.has(key)) {
        db.set(key, { word: v, articleId: article.id, level: article.level })
      }
    }
  }

  return db
}

// Get words that are new (never studied)
export function getNewWords(
  db: Map<string, { word: VocabularyItem; articleId: string; level: number }>,
  count: number
): { id: string; word: VocabularyItem; articleId: string; level: number }[] {
  const progress = getAllProgress()
  const newWords: { id: string; word: VocabularyItem; articleId: string; level: number }[] = []

  db.forEach((value, key) => {
    if (newWords.length >= count) return
    const wordId = getWordId(value.word.word, value.level, value.articleId)
    if (!progress[wordId] || progress[wordId].level === 0) {
      newWords.push({ id: wordId, ...value })
    }
  })

  return newWords
}

// Get words due for review
export function getReviewWords(
  count: number
): { id: string; word: VocabularyItem; articleId: string; level: number }[] {
  const progress = getAllProgress()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const dueEntries: { id: string; progress: WordProgress }[] = []

  for (const [id, prog] of Object.entries(progress)) {
    if (prog.level > 0 && prog.nextReview <= todayStr) {
      dueEntries.push({ id, progress: prog })
    }
  }

  // Shuffle and limit
  const shuffled = dueEntries.sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, count)

  return selected.map((entry) => ({
    id: entry.id,
    word: {
      word: entry.progress.word,
      pinyin: entry.progress.pinyin,
      meaning: entry.progress.meaning,
    },
    articleId: entry.progress.articleId,
    level: entry.progress.level,
  }))
}

// Record an answer
export function recordAnswer(
  wordId: string,
  word: VocabularyItem,
  articleId: string,
  correct: boolean
): WordProgress {
  const progress = getAllProgress()
  const existing = progress[wordId]

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const nextReview = new Date(today)

  if (correct) {
    // Spaced repetition: longer intervals
    const level = existing ? Math.min(existing.level + 1, 3) : 1
    const days = [0, 1, 3, 7, 14][level] || 7
    nextReview.setDate(nextReview.getDate() + days)

    progress[wordId] = {
      word: word.word,
      meaning: word.meaning,
      pinyin: word.pinyin,
      level,
      nextReview: `${nextReview.getFullYear()}-${String(nextReview.getMonth() + 1).padStart(2, '0')}-${String(nextReview.getDate()).padStart(2, '0')}`,
      reviewCount: (existing?.reviewCount || 0) + 1,
      correctCount: (existing?.correctCount || 0) + 1,
      lastReviewDate: todayStr,
      articleId,
    }
  } else {
    // Wrong: review tomorrow
    nextReview.setDate(nextReview.getDate() + 1)

    progress[wordId] = {
      word: word.word,
      meaning: word.meaning,
      pinyin: word.pinyin,
      level: existing ? Math.max(existing.level - 1, 1) : 1,
      nextReview: `${nextReview.getFullYear()}-${String(nextReview.getMonth() + 1).padStart(2, '0')}-${String(nextReview.getDate()).padStart(2, '0')}`,
      reviewCount: (existing?.reviewCount || 0) + 1,
      correctCount: existing?.correctCount || 0,
      lastReviewDate: todayStr,
      articleId,
    }
  }

  saveAllProgress(progress)

  // Trigger auto-checkin on learning activity
  const { doCheckIn } = require('./checkin')
  doCheckIn()

  return progress[wordId]
}

export function getDueReviewCount(): number {
  const progress = getAllProgress()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return Object.values(progress).filter(
    (p) => p.level > 0 && p.nextReview <= todayStr
  ).length
}

export function getNewWordsCount(db: Map<string, { word: VocabularyItem; articleId: string; level: number }>): number {
  const progress = getAllProgress()
  let count = 0

  db.forEach((value) => {
    const wordId = getWordId(value.word.word, value.level, value.articleId)
    if (!progress[wordId] || progress[wordId].level === 0) {
      count++
    }
  })

  return count
}
