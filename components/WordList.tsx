'use client'

import { useState, useCallback } from 'react'
import type { VocabularyItem } from '@/lib/types'

interface WordListProps {
  vocabulary: VocabularyItem[]
}

export default function WordList({ vocabulary }: WordListProps) {
  const [playing, setPlaying] = useState<string | null>(null)

  const speak = useCallback((word: VocabularyItem) => {
    if (typeof window === 'undefined') return
    setPlaying(word.word)
    const utterance = new SpeechSynthesisUtterance(word.word)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.9
    utterance.onend = () => setPlaying(null)
    utterance.onerror = () => setPlaying(null)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }, [])

  const speakAll = useCallback(() => {
    if (typeof window === 'undefined') return
    const words = vocabulary.map((v) => v.word).join('。')
    setPlaying('all')
    const utterance = new SpeechSynthesisUtterance(words)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.85
    utterance.onend = () => setPlaying(null)
    utterance.onerror = () => setPlaying(null)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }, [vocabulary])

  return (
    <section className="mt-12 border-t pt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          本课词汇 ({vocabulary.length})
        </h2>
        <button
          onClick={speakAll}
          disabled={playing === 'all'}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {playing === 'all' ? '🔊' : '🔈'} 朗读全部
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {vocabulary.map((v, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-800">
                {v.word}
              </span>
              <button
                onClick={() => speak(v)}
                disabled={playing === v.word}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-orange-100 disabled:opacity-50 flex items-center justify-center transition-colors"
                aria-label={`朗读 ${v.word}`}
              >
                {playing === v.word ? '🔊' : '🔈'}
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{v.pinyin}</p>
            <p className="text-sm text-gray-500">{v.meaning}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
