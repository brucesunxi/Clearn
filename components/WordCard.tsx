'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { speak } from '@/lib/tts'
import { getWordId, recordAnswer } from '@/lib/words'
import type { VocabularyItem } from '@/lib/types'

interface WordCardProps {
  word: VocabularyItem
  articleId: string
  articleLevel: number
  onClose: () => void
}

export default function WordCard({ word, articleId, articleLevel, onClose }: WordCardProps) {
  const { t, locale } = useTranslation()
  const [playing, setPlaying] = useState(false)
  const [added, setAdded] = useState(false)

  const handleSpeak = () => {
    setPlaying(true)
    speak(word.word, { onEnd: () => setPlaying(false) })
  }

  const handleAddToStudy = () => {
    const wordId = getWordId(word.word, articleLevel, articleId)
    // Record as "correct" once to start the word at stage 1
    recordAnswer(wordId, word, articleId, true)
    setAdded(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Word + Audio */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl font-bold text-gray-800">{word.word}</span>
          <button
            onClick={handleSpeak}
            disabled={playing}
            className="w-11 h-11 rounded-full bg-orange-100 hover:bg-orange-200 disabled:opacity-50 flex items-center justify-center transition-colors"
          >
            {playing ? '🔊' : '🔈'}
          </button>
        </div>

        <p className="text-lg text-gray-500 mb-1">{word.pinyin}</p>
        <p className="text-base text-gray-600 mb-4">{word.meaning}</p>

        {/* Memory tip */}
        {word.tips && (
          <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 mb-4">
            <p className="text-xs text-orange-400 font-medium mb-1">💡 {t('wordcard.tips')}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{word.tips}</p>
          </div>
        )}

        {/* Add to study list button */}
        {added ? (
          <div className="w-full py-2.5 rounded-xl bg-emerald-100 text-emerald-600 text-sm font-medium text-center mb-2">
            ✅ {locale === 'zh' ? '已加入学习列表' : 'Added to study list'}
          </div>
        ) : (
          <button
            onClick={handleAddToStudy}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors mb-2"
          >
            📝 {locale === 'zh' ? '加入学习列表' : 'Add to study list'}
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm text-gray-500 transition-colors"
        >
          {t('wordcard.close')}
        </button>
      </div>
    </div>
  )
}
