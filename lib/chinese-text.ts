import { pinyin } from 'pinyin-pro'
import type { Paragraph, VocabularyItem, Article } from './types'
import { WORD_BOOKS } from './wordbooks'

export function buildVocabDict(articles: Article[]): Map<string, VocabularyItem> {
  const dict = new Map<string, VocabularyItem>()

  for (const book of WORD_BOOKS) {
    for (const w of book.words) {
      if (!dict.has(w.word)) {
        dict.set(w.word, { word: w.word, pinyin: w.pinyin, meaning: w.meaning, tips: w.tips })
      }
    }
  }

  for (const article of articles) {
    for (const v of article.vocabulary) {
      if (!dict.has(v.word)) {
        dict.set(v.word, v)
      }
    }
  }

  return dict
}

export function splitIntoParagraphs(rawText: string): Paragraph[] {
  return rawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((text) => ({ text, translation: '' }))
}

export function extractVocabulary(
  text: string,
  dict: Map<string, VocabularyItem>
): VocabularyItem[] {
  const found = new Set<string>()
  const result: VocabularyItem[] = []

  const sorted = Array.from(dict.entries()).sort((a, b) => b[0].length - a[0].length)

  let remaining = text
  while (remaining.length > 0) {
    let best: { index: number; word: string } | null = null

    for (const [word] of sorted) {
      const idx = remaining.indexOf(word)
      if (idx !== -1 && (best === null || idx < best.index)) {
        best = { index: idx, word }
      }
    }

    if (best) {
      if (!found.has(best.word)) {
        found.add(best.word)
        const item = dict.get(best.word)!
        result.push(item)
      }
      remaining = remaining.slice(best.index + best.word.length)
    } else {
      remaining = ''
    }
  }

  return result
}

export function generateWordPinyin(word: string): string {
  try {
    return pinyin(word)
  } catch {
    return ''
  }
}

export function suggestNewWords(
  text: string,
  dict: Map<string, VocabularyItem>
): VocabularyItem[] {
  const knownWords = new Set(dict.keys())
  const newWords: VocabularyItem[] = []
  const seen = new Set<string>()

  const chineseRuns = text.match(/[一-鿿]{2,4}/g) || []
  for (const seq of chineseRuns) {
    if (!knownWords.has(seq) && !seen.has(seq)) {
      seen.add(seq)
      const py = generateWordPinyin(seq)
      newWords.push({ word: seq, pinyin: py, meaning: '' })
    }
  }

  return newWords
}
