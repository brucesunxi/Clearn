'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { speak, initVoice } from '@/lib/tts'
import type { VocabularyItem } from '@/lib/types'

export type Judgment = 'remember' | 'forgot' | null
export type Verification = 'knew' | 'not-really' | null

interface FlashcardProps {
  word: VocabularyItem
  onResult: (correct: boolean) => void
}

export default function Flashcard({ word, onResult }: FlashcardProps) {
  const { t, locale } = useTranslation()
  const [judgment, setJudgment] = useState<Judgment>(null)
  const [showingVerification, setShowingVerification] = useState(false)
  const [playing, setPlaying] = useState(false)
  const spokenRef = useRef(false)

  // Initialize TTS voice early
  useEffect(() => { initVoice() }, [])

  // Auto-speak when a new word appears
  useEffect(() => {
    if (!spokenRef.current) {
      spokenRef.current = true
      const timer = setTimeout(() => {
        speak(word.word)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [word.word])

  const playAudio = () => {
    speak(word.word)
  }

  const handleRemember = () => {
    setJudgment('remember')
    setShowingVerification(true)
  }

  const handleForgot = () => {
    setJudgment('forgot')
  }

  const handleKnew = () => onResult(true)
  const handleNotReally = () => onResult(false)
  const handleContinue = () => onResult(false)

  if (judgment === null) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        <button
          onClick={playAudio}
          className="text-5xl mb-4 hover:scale-110 transition-transform cursor-pointer"
          title={locale === 'zh' ? '听发音' : 'Listen'}
        >
          {playing ? '🔊' : '🔇'}
        </button>
        <div className="text-5xl font-bold text-gray-800 mb-8 mt-2">{word.word}</div>
        <button
          onClick={handleRemember}
          className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white text-lg font-medium mb-3 transition-colors shadow-sm"
        >
          ✅ {t('flashcard.remember')}
        </button>
        <button
          onClick={handleForgot}
          className="w-full py-4 rounded-xl bg-red-400 hover:bg-red-500 text-white text-lg font-medium transition-colors shadow-sm"
        >
          ❌ {t('flashcard.forgot')}
        </button>
      </div>
    )
  }

  if (judgment === 'remember' && showingVerification) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        <button
          onClick={playAudio}
          className="text-3xl mb-3 hover:scale-110 transition-transform cursor-pointer"
          title={locale === 'zh' ? '听发音' : 'Listen'}
        >
          {playing ? '🔊' : '🔇'}
        </button>
        <div className="text-4xl font-bold text-gray-800 mb-3">{word.word}</div>
        <div className="text-lg text-gray-500 mb-1">{word.pinyin}</div>
        <div className="text-xl text-gray-700 mb-6 font-medium">{word.meaning}</div>
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-600 font-medium mb-1">🤔 {t('flashcard.verifyTitle')}</p>
          <p className="text-xs text-blue-400">{t('flashcard.verifyDesc')}</p>
        </div>
        <button
          onClick={handleKnew}
          className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-base font-medium mb-3 transition-colors"
        >
          👍 {t('flashcard.knew')}
        </button>
        <button
          onClick={handleNotReally}
          className="w-full py-3 rounded-xl bg-orange-400 hover:bg-orange-500 text-white text-base font-medium transition-colors"
        >
          😅 {t('flashcard.notReally')}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
      <button
        onClick={playAudio}
        className="text-3xl mb-3 hover:scale-110 transition-transform cursor-pointer"
        title={locale === 'zh' ? '听发音' : 'Listen'}
      >
        {playing ? '🔊' : '🔇'}
      </button>
      <div className="text-3xl font-bold text-gray-800 mb-2">{word.word}</div>
      <div className="text-base text-gray-500 mb-1">{word.pinyin}</div>
      <div className="text-lg text-gray-700 mb-6">{word.meaning}</div>
      {word.tips ? (
        <div className="bg-orange-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs text-orange-400 font-medium mb-1">💡 {t('wordcard.tips')}</p>
          <p className="text-sm text-gray-600 leading-relaxed">{word.tips}</p>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-400">{t('flashcard.noTips')}</p>
        </div>
      )}
      <button
        onClick={handleContinue}
        className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-base font-medium transition-colors"
      >
        {t('flashcard.continue')} →
      </button>
    </div>
  )
}
