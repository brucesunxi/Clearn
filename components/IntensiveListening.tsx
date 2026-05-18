'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { speak, cancelSpeech } from '@/lib/tts'
import type { Article } from '@/lib/types'

interface IntensiveListeningProps {
  articles: Article[]
}

type Step = 'select' | 'listening' | 'done'

export default function IntensiveListening({ articles }: IntensiveListeningProps) {
  const { locale } = useTranslation()
  const [step, setStep] = useState<Step>('select')
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [sentences, setSentences] = useState<string[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [playing, setPlaying] = useState(false)

  // Split article paragraphs into sentences
  const splitSentences = useCallback((article: Article): string[] => {
    const result: string[] = []
    for (const p of article.paragraphs) {
      // Split by Chinese sentence-ending punctuation
      const parts = p.text.split(/(?<=[。！？!?])/).filter(Boolean)
      for (const part of parts) {
        const trimmed = part.trim()
        if (trimmed) result.push(trimmed)
      }
    }
    return result
  }, [])

  const startArticle = useCallback((article: Article) => {
    const s = splitSentences(article)
    setSelectedArticle(article)
    setSentences(s)
    setCurrentIdx(0)
    setRevealed(new Set())
    setStep('listening')
    // Auto-play first sentence after a brief delay
    setTimeout(() => playSentence(0, s), 500)
  }, [splitSentences])

  const playSentence = useCallback((idx: number, s?: string[]) => {
    const list = s || sentences
    if (idx >= list.length) return
    cancelSpeech()
    setPlaying(true)
    setCurrentIdx(idx)
    speak(list[idx], { onEnd: () => setPlaying(false) })
  }, [sentences])

  const handleReveal = (idx: number) => {
    setRevealed((prev) => {
      const next = new Set(prev)
      next.add(idx)
      return next
    })
  }

  const handleNext = () => {
    if (currentIdx + 1 < sentences.length) {
      const next = currentIdx + 1
      setCurrentIdx(next)
      setRevealed((prev) => {
        // Reveal the next sentence too
        const r = new Set(prev)
        r.add(next)
        return r
      })
      playSentence(next)
    } else {
      setStep('done')
    }
  }

  const handleReplay = () => {
    playSentence(currentIdx)
  }

  // Article selection screen
  if (step === 'select') {
    return (
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            🎧 {locale === 'zh' ? '精听练习' : 'Intensive Listening'}
          </h2>
          <p className="text-sm text-gray-400">
            {locale === 'zh' ? '选择一篇文章，逐句精听。每句会先播放再揭晓文字。' : 'Pick an article. Listen sentence by sentence, then reveal the text.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {articles.map((article) => {
            const sentenceCount = splitSentences(article).length
            return (
              <button
                key={article.id}
                onClick={() => startArticle(article)}
                className="group bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-3xl">{article.emoji}</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{article.title}</h3>
                    <p className="text-sm text-gray-400">{article.titleEn}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>📝 {sentenceCount} {locale === 'zh' ? '句' : 'sentences'}</span>
                  <span>📖 {article.vocabulary.length} {locale === 'zh' ? '生词' : 'words'}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Done screen
  if (step === 'done') {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {locale === 'zh' ? '精听完成！' : 'Intensive Listening Complete!'}
        </h2>
        <p className="text-gray-400 mb-8">
          {locale === 'zh'
            ? `你完成了「${selectedArticle?.title}」的精听`
            : `You completed "${selectedArticle?.titleEn}"`}
        </p>
        <button
          onClick={() => setStep('select')}
          className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
        >
          {locale === 'zh' ? '选择其他文章' : 'Choose Another Article'}
        </button>
      </div>
    )
  }

  // Listening screen
  return (
    <div>
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => { cancelSpeech(); setStep('select') }}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← {locale === 'zh' ? '返回' : 'Back'}
        </button>
        <div className="text-sm text-gray-400">
          {selectedArticle?.emoji} {selectedArticle?.title}
        </div>
        <div className="text-sm text-gray-400">
          {currentIdx + 1} / {sentences.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-8">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIdx) / sentences.length) * 100}%` }}
        />
      </div>

      {/* Sentence list */}
      <div className="space-y-4 mb-8">
        {sentences.map((sentence, idx) => {
          const isCurrent = idx === currentIdx
          const isRevealed = revealed.has(idx)

          return (
            <div
              key={idx}
              className={`rounded-xl border transition-all ${
                isCurrent
                  ? 'border-blue-300 bg-blue-50/50 shadow-sm'
                  : idx < currentIdx
                  ? 'border-gray-100 bg-white'
                  : 'border-gray-100 bg-white opacity-60'
              }`}
            >
              <div className="p-4">
                {/* Sentence content */}
                <div
                  className={`text-lg leading-relaxed ${
                    isRevealed ? 'text-gray-800' : 'blur-md select-none text-gray-800/40'
                  } ${!isRevealed ? 'cursor-pointer' : ''}`}
                  onClick={() => !isRevealed && handleReveal(idx)}
                  title={!isRevealed ? (locale === 'zh' ? '点击擦除查看' : 'Click to reveal') : ''}
                >
                  {sentence}
                </div>

                {/* Action row for current sentence */}
                {isCurrent && (
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-blue-200/50">
                    <button
                      onClick={handleReplay}
                      disabled={playing}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 disabled:opacity-50 text-blue-600 text-sm font-medium transition-colors"
                    >
                      {playing ? '🔊' : '🔈'} {locale === 'zh' ? '重听' : 'Replay'}
                    </button>

                    {isRevealed ? (
                      <button
                        onClick={handleNext}
                        className="flex-1 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors shadow-sm"
                      >
                        {currentIdx + 1 < sentences.length
                          ? (locale === 'zh' ? '下一句 →' : 'Next →')
                          : (locale === 'zh' ? '查看结果 📊' : 'See Results 📊')}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReveal(idx)}
                        className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm font-medium transition-colors"
                      >
                        {locale === 'zh' ? '👆 点击擦除查看' : '👆 Tap to reveal'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
