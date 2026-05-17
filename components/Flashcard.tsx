'use client'

import { useState } from 'react'
import { speak } from '@/lib/tts'
import type { VocabularyItem } from '@/lib/types'

export type Judgment = 'remember' | 'forgot' | null
export type Verification = 'knew' | 'not-really' | null

interface FlashcardProps {
  word: VocabularyItem
  onResult: (correct: boolean) => void
}

export default function Flashcard({ word, onResult }: FlashcardProps) {
  const [judgment, setJudgment] = useState<Judgment>(null)
  const [showingVerification, setShowingVerification] = useState(false)

  const handleRemember = () => {
    setJudgment('remember')
    setShowingVerification(true)
    speak(word.word)
  }

  const handleForgot = () => {
    setJudgment('forgot')
    speak(word.word)
  }

  const handleKnew = () => {
    onResult(true)
  }

  const handleNotReally = () => {
    onResult(false)
  }

  const handleContinue = () => {
    onResult(false)
  }

  // Initial state: show just the word
  if (judgment === null) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        <div className="text-5xl font-bold text-gray-800 mb-8 mt-4">
          {word.word}
        </div>
        <button
          onClick={handleRemember}
          className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white text-lg font-medium mb-3 transition-colors shadow-sm"
        >
          ✅ 我记得
        </button>
        <button
          onClick={handleForgot}
          className="w-full py-4 rounded-xl bg-red-400 hover:bg-red-500 text-white text-lg font-medium transition-colors shadow-sm"
        >
          ❌ 不记得
        </button>
      </div>
    )
  }

  // "Remember" state: verify if they truly know it
  if (judgment === 'remember' && showingVerification) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        <div className="text-4xl font-bold text-gray-800 mb-3">
          {word.word}
        </div>
        <div className="text-lg text-gray-500 mb-1">{word.pinyin}</div>
        <div className="text-xl text-gray-700 mb-6 font-medium">{word.meaning}</div>

        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-600 font-medium mb-1">🤔 你真的知道了吗？</p>
          <p className="text-xs text-blue-400">先回想一下再确认</p>
        </div>

        <button
          onClick={handleKnew}
          className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-base font-medium mb-3 transition-colors"
        >
          👍 知道了
        </button>
        <button
          onClick={handleNotReally}
          className="w-full py-3 rounded-xl bg-orange-400 hover:bg-orange-500 text-white text-base font-medium transition-colors"
        >
          😅 其实不知道
        </button>
      </div>
    )
  }

  // "Don't remember" state: show tips
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
      <div className="text-3xl font-bold text-gray-800 mb-2">
        {word.word}
      </div>
      <div className="text-base text-gray-500 mb-1">{word.pinyin}</div>
      <div className="text-lg text-gray-700 mb-6">{word.meaning}</div>

      {word.tips ? (
        <div className="bg-orange-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs text-orange-400 font-medium mb-1">💡 记忆技巧</p>
          <p className="text-sm text-gray-600 leading-relaxed">{word.tips}</p>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-400">暂无记忆技巧，多读几遍记住吧📝</p>
        </div>
      )}

      <button
        onClick={handleContinue}
        className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-base font-medium transition-colors"
      >
        继续 →
      </button>
    </div>
  )
}
