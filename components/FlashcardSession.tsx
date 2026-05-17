'use client'

import { useState, useMemo, useCallback } from 'react'
import Flashcard from './Flashcard'
import type { Article, VocabularyItem } from '@/lib/types'
import { buildWordDatabase, getNewWords, getReviewWords, recordAnswer } from '@/lib/words'

interface FlashcardSessionProps {
  articles: Article[]
}

interface SessionCard {
  id: string
  word: VocabularyItem
  articleId: string
  level: number
  type: 'new' | 'review'
  correct: boolean | null
}

export default function FlashcardSession({ articles }: FlashcardSessionProps) {
  const [step, setStep] = useState<'config' | 'learning' | 'summary'>('config')
  const [newCount, setNewCount] = useState(5)
  const [reviewCount, setReviewCount] = useState(5)
  const [cards, setCards] = useState<SessionCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<SessionCard[]>([])

  const wordDb = useMemo(() => buildWordDatabase(articles), [articles])

  const startSession = useCallback(() => {
    const news = getNewWords(wordDb, newCount).map((w) => ({
      ...w,
      type: 'new' as const,
      correct: null,
    }))
    const reviews = getReviewWords(reviewCount).map((w) => ({
      ...w,
      type: 'review' as const,
      correct: null,
    }))

    const allCards = [...news, ...reviews].sort(() => Math.random() - 0.5)

    if (allCards.length === 0) {
      setStep('summary')
      return
    }

    setCards(allCards)
    setCurrentIndex(0)
    setResults([])
    setStep('learning')
  }, [wordDb, newCount, reviewCount])

  const handleResult = useCallback((correct: boolean) => {
    const currentCard = cards[currentIndex]
    const updatedCard = { ...currentCard, correct }

    // Record in localStorage
    recordAnswer(currentCard.id, currentCard.word, currentCard.articleId, correct)

    setResults((prev) => [...prev, updatedCard])

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((i) => i + 1)
    } else {
      setStep('summary')
    }
  }, [cards, currentIndex])

  const correctCount = results.filter((r) => r.correct === true).length
  const wrongCount = results.filter((r) => r.correct === false).length

  if (step === 'config') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">开始学习 📚</h2>
        <p className="text-sm text-gray-400 mb-6">设置今天要学习的单词数量</p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              新词数量
            </label>
            <div className="flex gap-2">
              {[3, 5, 10, 15].map((n) => (
                <button
                  key={n}
                  onClick={() => setNewCount(n)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    newCount === n
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {n} 个
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              复习数量
            </label>
            <div className="flex gap-2">
              {[3, 5, 10, 15].map((n) => (
                <button
                  key={n}
                  onClick={() => setReviewCount(n)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    reviewCount === n
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {n} 个
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={startSession}
          className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-base font-medium transition-colors shadow-sm"
        >
          开始学习 🚀
        </button>
      </div>
    )
  }

  if (step === 'learning') {
    const currentCard = cards[currentIndex]
    return (
      <div>
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>
              {currentIndex + 1} / {cards.length}
            </span>
            <span>
              {currentCard.type === 'new' ? '🆕 新词' : '🔄 复习'}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
            />
          </div>
        </div>

        <Flashcard word={currentCard.word} onResult={handleResult} />
      </div>
    )
  }

  // Summary
  const totalDone = results.length
  const accuracy = totalDone > 0 ? Math.round((correctCount / totalDone) * 100) : 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
      <div className="text-4xl mb-4">
        {accuracy >= 80 ? '🎉' : accuracy >= 50 ? '💪' : '🌱'}
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">学习完成！</h2>
      <p className="text-sm text-gray-400 mb-6">今天的成果</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-green-600">{correctCount}</div>
          <div className="text-xs text-green-500">✅ 正确</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-red-400">{wrongCount}</div>
          <div className="text-xs text-red-400">❌ 错误</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-blue-500">{accuracy}%</div>
          <div className="text-xs text-blue-400">📊 正确率</div>
        </div>
      </div>

      {/* Incorrect words for review */}
      {results.filter((r) => r.correct === false).length > 0 && (
        <div className="mb-6 text-left">
          <h3 className="text-sm font-medium text-gray-600 mb-2">需要再复习的单词：</h3>
          <div className="space-y-2">
            {results
              .filter((r) => r.correct === false)
              .map((r, i) => (
                <div key={i} className="bg-red-50 rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="font-medium text-gray-700">{r.word.word}</span>
                  <span className="text-sm text-gray-400">{r.word.meaning}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setStep('config')}
        className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-base font-medium transition-colors"
      >
        再来一轮 🔄
      </button>
    </div>
  )
}
