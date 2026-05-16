'use client'

import { useState, useMemo } from 'react'
import type { Article, VocabularyItem } from '@/lib/types'
import WordCard from './WordCard'

interface ArticleContentProps {
  article: Article
}

export default function ArticleContent({ article }: ArticleContentProps) {
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null)
  const [showTranslations, setShowTranslations] = useState(false)

  // Sort vocabulary by length (longest first) to match multi-char words first
  const sortedVocab = useMemo(
    () =>
      [...article.vocabulary].sort(
        (a, b) => b.word.length - a.word.length
      ),
    [article.vocabulary]
  )

  const highlightText = (text: string): (string | VocabularyItem)[] => {
    const parts: (string | VocabularyItem)[] = []
    let remaining = text

    while (remaining.length > 0) {
      let match: { index: number; word: VocabularyItem } | null = null

      for (const v of sortedVocab) {
        const idx = remaining.indexOf(v.word)
        if (idx !== -1 && (match === null || idx < match.index)) {
          match = { index: idx, word: v }
        }
      }

      if (match) {
        if (match.index > 0) {
          parts.push(remaining.slice(0, match.index))
        }
        parts.push(match.word)
        remaining = remaining.slice(match.index + match.word.word.length)
      } else {
        parts.push(remaining)
        remaining = ''
      }
    }

    return parts
  }

  return (
    <article className="max-w-2xl mx-auto">
      {/* Article header */}
      <div className="text-center mb-8">
        <span className="text-5xl block mb-4">{article.emoji}</span>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {article.title}
        </h1>
        <p className="text-gray-400">{article.titleEn}</p>
      </div>

      {/* Translation toggle */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setShowTranslations(!showTranslations)}
          className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
            showTranslations
              ? 'bg-orange-500 text-white border-orange-500'
              : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300'
          }`}
        >
          {showTranslations ? '隐藏翻译 🙈' : '显示翻译 🌏'}
        </button>
      </div>

      {/* Paragraphs */}
      <div className="space-y-6">
        {article.paragraphs.map((p, i) => (
          <div key={i}>
            <p className="text-xl leading-[2.2] text-gray-800">
              {highlightText(p.text).map((part, j) =>
                typeof part === 'string' ? (
                  <span key={j}>{part}</span>
                ) : (
                  <button
                    key={j}
                    onClick={() => setSelectedWord(part)}
                    className="word-highlight inline"
                    title={`${part.word} (${part.pinyin})`}
                  >
                    {part.word}
                  </button>
                )
              )}
            </p>
            {showTranslations && (
              <p className="text-sm text-gray-400 mt-1 italic">
                {p.translation}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Word card modal */}
      {selectedWord && (
        <WordCard
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </article>
  )
}
