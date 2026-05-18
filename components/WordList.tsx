'use client'

import { useState, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { speak } from '@/lib/tts'
import type { VocabularyItem } from '@/lib/types'

interface WordListProps {
  vocabulary: VocabularyItem[]
}

export default function WordList({ vocabulary }: WordListProps) {
  const { t } = useTranslation()
  const [playing, setPlaying] = useState<string | null>(null)

  const handleSpeak = useCallback((word: VocabularyItem) => {
    setPlaying(word.word)
    speak(word.word, { onEnd: () => setPlaying(null) })
  }, [])

  const speakAll = useCallback(() => {
    const words = vocabulary.map((v) => v.word).join('。')
    setPlaying('all')
    speak(words, { onEnd: () => setPlaying(null) })
  }, [vocabulary])

  return (
    <section className="mt-12 border-t pt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          {t('wordlist.allWords')} ({vocabulary.length})
        </h2>
        <div className="flex gap-2">
          <button
            onClick={speakAll}
            disabled={playing === 'all'}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {playing === 'all' ? '🔊' : '🔈'} {t('wordlist.speakAll')}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {vocabulary.map((v, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-800">{v.word}</span>
              <button
                onClick={() => handleSpeak(v)}
                disabled={playing === v.word}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-orange-100 disabled:opacity-50 flex items-center justify-center transition-colors"
                aria-label="朗读"
              >
                {playing === v.word ? '🔊' : '🔈'}
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{v.pinyin}</p>
            <p className="text-sm text-gray-500">{v.meaning}</p>
            {v.tips && (
              <p className="text-xs text-orange-300 mt-1 truncate" title={v.tips}>
                💡 {v.tips}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
