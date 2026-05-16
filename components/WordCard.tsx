'use client'

import { useState, useCallback } from 'react'
import type { VocabularyItem } from '@/lib/types'

interface WordCardProps {
  word: VocabularyItem
  onClose: () => void
}

export default function WordCard({ word, onClose }: WordCardProps) {
  const [playing, setPlaying] = useState(false)

  const speak = useCallback(() => {
    if (typeof window === 'undefined') return
    setPlaying(true)
    const utterance = new SpeechSynthesisUtterance(word.word)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.9
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => setPlaying(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }, [word.word])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl font-bold text-gray-800">{word.word}</span>
          <button
            onClick={speak}
            disabled={playing}
            className="w-12 h-12 rounded-full bg-orange-100 hover:bg-orange-200 disabled:opacity-50 flex items-center justify-center transition-colors"
            aria-label="朗读"
          >
            {playing ? (
              <span className="text-xl">🔊</span>
            ) : (
              <span className="text-xl">🔈</span>
            )}
          </button>
        </div>
        <p className="text-lg text-gray-500 mb-1">{word.pinyin}</p>
        <p className="text-base text-gray-600">{word.meaning}</p>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm text-gray-500 transition-colors"
        >
          关闭
        </button>
      </div>
    </div>
  )
}
