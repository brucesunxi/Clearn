'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { speak } from '@/lib/tts'
import { getWordId, getAllProgress } from '@/lib/words'
import type { VocabularyItem } from '@/lib/types'

interface WordListProps {
  vocabulary: VocabularyItem[]
  articleId: string
}

export default function WordList({ vocabulary, articleId }: WordListProps) {
  const { t, locale } = useTranslation()
  const [playing, setPlaying] = useState<string | null>(null)
  const [progressMap, setProgressMap] = useState<Record<string, number>>({})

  useEffect(() => {
    const all = getAllProgress()
    const map: Record<string, number> = {}
    for (const [id, p] of Object.entries(all)) {
      if (p.articleId === articleId || id.includes(articleId)) {
        map[id] = p.stage
      }
    }
    setProgressMap(map)
  }, [articleId])

  const handleSpeak = useCallback((word: VocabularyItem) => {
    setPlaying(word.word)
    speak(word.word, { onEnd: () => setPlaying(null) })
  }, [])

  const speakAll = useCallback(() => {
    const words = vocabulary.map((v) => v.word).join('。')
    setPlaying('all')
    speak(words, { onEnd: () => setPlaying(null) })
  }, [vocabulary])

  const getStageLabel = (stage: number): string => {
    if (stage === 0) return locale === 'zh' ? '未学' : 'New'
    if (stage >= 7) return locale === 'zh' ? '已掌握' : 'Mastered'
    return locale === 'zh' ? `复习${stage}` : `Rev ${stage}`
  }

  const getStageColor = (stage: number): string => {
    if (stage === 0) return 'bg-gray-100 text-gray-400'
    if (stage >= 7) return 'bg-emerald-100 text-emerald-600'
    return 'bg-amber-100 text-amber-600'
  }

  return (
    <section className="mt-12 border-t pt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          📝 {t('wordlist.allWords')}
          <span className="text-sm font-normal text-gray-400 ml-2">({vocabulary.length})</span>
        </h2>
        <button
          onClick={speakAll}
          disabled={playing === 'all'}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-100 hover:bg-orange-200 disabled:opacity-50 text-orange-600 text-sm font-medium transition-colors"
        >
          {playing === 'all' ? '🔊' : '🔈'} {t('wordlist.speakAll')}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {vocabulary.map((v) => {
          // Try to find progress for this word
          const wordId = Object.keys(progressMap).find((id) => id.startsWith(v.word))
          const stage = wordId ? progressMap[wordId] : 0

          return (
            <div
              key={v.word}
              className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm hover:shadow transition-all"
            >
              <div className="flex items-start justify-between mb-1.5">
                <span className="text-lg font-bold text-gray-800">{v.word}</span>
                <button
                  onClick={() => handleSpeak(v)}
                  disabled={playing === v.word}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center text-xs transition-colors shrink-0"
                >
                  {playing === v.word ? '🔊' : '🔈'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-0.5">{v.pinyin}</p>
              <p className="text-sm text-gray-600 mb-2">{v.meaning}</p>
              <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${getStageColor(stage)}`}>
                {getStageLabel(stage)}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
