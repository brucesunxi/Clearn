'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { speak } from '@/lib/tts'
import type { VocabularyItem } from '@/lib/types'

interface WordCardProps {
  word: VocabularyItem
  onClose: () => void
}

export default function WordCard({ word, onClose }: WordCardProps) {
  const { t } = useTranslation()
  const [playing, setPlaying] = useState(false)

  const handleSpeak = () => {
    setPlaying(true)
    speak(word.word, { onEnd: () => setPlaying(false) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl font-bold text-gray-800">{word.word}</span>
          <button
            onClick={handleSpeak}
            disabled={playing}
            className="w-12 h-12 rounded-full bg-orange-100 hover:bg-orange-200 disabled:opacity-50 flex items-center justify-center transition-colors"
            aria-label="朗读"
          >
            {playing ? '🔊' : '🔈'}
          </button>
        </div>
        <p className="text-lg text-gray-500 mb-1">{word.pinyin}</p>
        <p className="text-base text-gray-600 mb-3">{word.meaning}</p>
        {word.tips && (
          <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
            <p className="text-xs text-orange-400 font-medium mb-1">💡 {t('wordcard.tips')}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{word.tips}</p>
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm text-gray-500 transition-colors"
        >
          {t('wordcard.close')}
        </button>
      </div>
    </div>
  )
}
