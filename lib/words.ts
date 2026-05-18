'use client'

import type { Article, VocabularyItem } from './types'

const STORAGE_KEY = 'chineselearn-words'

export interface WordProgress {
  word: string
  meaning: string
  pinyin: string
  stage: number         // 0=new, 1-6=复习中, 7=已掌握
  nextReview: string    // ISO date string YYYY-MM-DD
  reviewCount: number
  lastReviewDate: string
  articleId: string
}

// Ebbinghaus forgetting curve intervals (in days)
// Stage 0 = new word (not yet learned)
// Stage 1 = 1st review → next in 1 day
// Stage 2 = 2nd review → next in 2 days
// Stage 3 = 3rd review → next in 4 days
// Stage 4 = 4th review → next in 7 days
// Stage 5 = 5th review → next in 15 days
// Stage 6 = 6th review → next in 30 days
// Stage 7 = 7th review → next in 90 days (mastered)
const EBBINGHAUS_INTERVALS = [0, 1, 2, 4, 7, 15, 30, 90]

export function getWordId(word: string, level: number, articleId: string): string {
  return `${word}_level-${level}_${articleId}`
}

function getAllProgress(): Record<string, WordProgress> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    // Migrate legacy 'level'-based data to 'stage'
    for (const key of Object.keys(data)) {
      if (data[key].level !== undefined && data[key].stage === undefined) {
        data[key].stage = Math.min(data[key].level + 1, 7)
        delete data[key].level
      }
    }
    return data
  } catch {
    return {}
  }
}

function saveAllProgress(data: Record<string, WordProgress>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function buildWordDatabase(
  articles: Article[]
): Map<string, { word: VocabularyItem; articleId: string; level: number }> {
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

export function getNewWords(
  db: Map<string, { word: VocabularyItem; articleId: string; level: number }>,
  count: number
): { id: string; word: VocabularyItem; articleId: string; level: number }[] {
  const progress = getAllProgress()
  const newWords: { id: string; word: VocabularyItem; articleId: string; level: number }[] = []

  db.forEach((value) => {
    if (newWords.length >= count) return
    const wordId = getWordId(value.word.word, value.level, value.articleId)
    const prog = progress[wordId]
    if (!prog || prog.stage === 0) {
      newWords.push({ id: wordId, ...value })
    }
  })

  return newWords
}

export function getReviewWords(
  count: number
): { id: string; word: VocabularyItem; articleId: string; level: number }[] {
  const progress = getAllProgress()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const dueEntries: { id: string; progress: WordProgress }[] = []

  for (const [id, prog] of Object.entries(progress)) {
    if (prog.stage > 0 && prog.stage < 7 && prog.nextReview <= todayStr) {
      dueEntries.push({ id, progress: prog })
    }
  }

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
    level: entry.progress.stage,
  }))
}

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

  if (correct) {
    // Correct: advance to next Ebbinghaus stage
    const currentStage = existing?.stage || 0
    const newStage = Math.min(currentStage + 1, 7)
    const intervalDays = EBBINGHAUS_INTERVALS[newStage] || 90

    const nextDate = new Date(today)
    nextDate.setDate(nextDate.getDate() + intervalDays)

    progress[wordId] = {
      word: word.word,
      meaning: word.meaning,
      pinyin: word.pinyin,
      stage: newStage,
      nextReview: `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`,
      reviewCount: (existing?.reviewCount || 0) + 1,
      lastReviewDate: todayStr,
      articleId,
    }
  } else {
    // Incorrect: reset to stage 1, review tomorrow
    const nextDate = new Date(today)
    nextDate.setDate(nextDate.getDate() + 1)

    progress[wordId] = {
      word: word.word,
      meaning: word.meaning,
      pinyin: word.pinyin,
      stage: 1,
      nextReview: `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`,
      reviewCount: (existing?.reviewCount || 0) + 1,
      lastReviewDate: todayStr,
      articleId,
    }
  }

  saveAllProgress(progress)
  return progress[wordId]
}

export function getDueReviewCount(): number {
  const progress = getAllProgress()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return Object.values(progress).filter(
    (p) => p.stage > 0 && p.stage < 7 && p.nextReview <= todayStr
  ).length
}

export function getNewWordsCount(
  db: Map<string, { word: VocabularyItem; articleId: string; level: number }>
): number {
  const progress = getAllProgress()
  let count = 0

  db.forEach((value) => {
    const wordId = getWordId(value.word.word, value.level, value.articleId)
    if (!progress[wordId] || progress[wordId].stage === 0) {
      count++
    }
  })

  return count
}

// --- Statistics helpers ---

export function getMasteredCount(): number {
  return Object.values(getAllProgress()).filter((p) => p.stage >= 7).length
}

export function getTotalWordsCount(): number {
  return Object.values(getAllProgress()).filter((p) => p.stage >= 1).length
}

export function getStageDistribution(): Record<number, number> {
  const dist: Record<number, number> = {}
  for (const p of Object.values(getAllProgress())) {
    dist[p.stage] = (dist[p.stage] || 0) + 1
  }
  return dist
}
