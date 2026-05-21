'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { speak } from '@/lib/tts'
import { addCoins, syncCoinsToApi } from '@/lib/pet'
import type { Article } from '@/lib/types'
import { buildWordDatabase } from '@/lib/words'

interface ListenSessionProps {
  articles: Article[]
}

interface ListenQuestion {
  word: string
  pinyin: string
  meaning: string
  options: string[]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function ListenSession({ articles }: ListenSessionProps) {
  const { t, locale } = useTranslation()
  const [step, setStep] = useState<'config' | 'playing' | 'result'>('config')
  const [count, setCount] = useState(5)
  const [questions, setQuestions] = useState<ListenQuestion[]>([])
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [answers, setAnswers] = useState<{ q: ListenQuestion; chosen: string; ok: boolean }[]>([])
  const hasPlayed = useRef(false)

  const wordDb = useMemo(() => buildWordDatabase(articles), [articles])

  const buildQuestions = useCallback((n: number): ListenQuestion[] => {
    const entries: { word: string; meaning: string; pinyin: string }[] = []
    wordDb.forEach((v) => entries.push({ word: v.word.word, meaning: v.word.meaning, pinyin: v.word.pinyin }))
    const picked = shuffle(entries).slice(0, Math.min(n, entries.length))
    return picked.map((e) => ({
      word: e.word,
      pinyin: e.pinyin,
      meaning: e.meaning,
      options: shuffle([e.meaning, ...shuffle(entries.filter((x) => x.meaning !== e.meaning)).slice(0, 3).map((x) => x.meaning)]),
    }))
  }, [wordDb])

  const start = useCallback(() => {
    const qs = buildQuestions(count)
    if (!qs.length) return
    setQuestions(qs); setIdx(0); setSelected(null); setRevealed(false)
    setCorrect(0); setCoinsEarned(0); setAnswers([]); setStep('playing')
    hasPlayed.current = false
  }, [buildQuestions, count])

  // Auto-play audio when question changes
  useEffect(() => {
    if (step === 'playing' && questions[idx]) {
      hasPlayed.current = false
      // Small delay to let component settle
      const timer = setTimeout(() => {
        speak(questions[idx].word)
        hasPlayed.current = true
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [step, idx, questions])

  const replay = () => { if (questions[idx]) speak(questions[idx].word) }

  const handleSelect = (option: string) => {
    if (revealed) return
    setSelected(option); setRevealed(true)
    const ok = option === questions[idx].meaning
    if (ok) setCorrect((c) => c + 1)
    setAnswers((prev) => [...prev, { q: questions[idx], chosen: option, ok }])
  }

  const next = () => {
    if (idx + 1 < questions.length) {
      setIdx((i) => i + 1); setSelected(null); setRevealed(false)
    } else {
      const earned = correct * 10 + 20
      addCoins(earned); syncCoinsToApi(earned, 'listen_complete', correct + '/' + questions.length + ' correct'); setCoinsEarned(earned); setStep('result')
    }
  }

  if (step === 'config') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">🎧 {locale === 'zh' ? '听力练习' : 'Listening Practice'}</h2>
        <p className="text-sm text-gray-400 mb-6">{locale === 'zh' ? '听中文，选英文' : 'Listen to Chinese, choose the English meaning'}</p>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">{locale === 'zh' ? '题目数量' : 'Questions'}</label>
          <div className="flex gap-2">
            {[5, 10, 15, 20].map((n) => (
              <button key={n} onClick={() => setCount(n)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${count === n ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>{n}</button>
            ))}
          </div>
        </div>
        <button onClick={start} className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors shadow-sm">
          {locale === 'zh' ? '开始听力 🎧' : 'Start Listening 🎧'}
        </button>
      </div>
    )
  }

  if (step === 'playing') {
    const q = questions[idx]
    return (
      <div>
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>{idx + 1} / {questions.length}</span>
          <span>✅ {correct}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(idx / questions.length) * 100}%` }} />
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <button onClick={replay} className="text-5xl mb-4 hover:scale-110 transition-transform cursor-pointer" title={locale === 'zh' ? '再听一次' : 'Listen again'}>
            🔊
          </button>
          <p className="text-sm text-gray-400 mb-6">{locale === 'zh' ? '点击喇叭听发音，选择正确的意思' : 'Tap the speaker, then pick the correct meaning'}</p>

          <div className="space-y-3">
            {q.options.map((opt, i) => {
              let cls = 'w-full py-3.5 rounded-xl text-base font-medium border-2 transition-all '
              if (!revealed) cls += 'border-gray-100 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              else if (opt === q.meaning) cls += 'border-green-500 bg-green-50 text-green-700'
              else if (opt === selected) cls += 'border-red-400 bg-red-50 text-red-600'
              else cls += 'border-gray-100 bg-gray-50 text-gray-400'
              return (
                <button key={i} onClick={() => handleSelect(opt)} disabled={revealed} className={cls}>
                  {opt}{revealed && opt === q.meaning && ' ✅'}{revealed && opt === selected && opt !== q.meaning && ' ❌'}
                </button>
              )
            })}
          </div>

          {revealed && (
            <button onClick={next}
              className="mt-6 w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-base font-medium transition-colors">
              {idx + 1 < questions.length ? (locale === 'zh' ? '下一题 →' : 'Next →') : (locale === 'zh' ? '查看成绩 📊' : 'See Results 📊')}
            </button>
          )}
        </div>
      </div>
    )
  }

  const accuracy = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
      <div className="text-4xl mb-4">{accuracy >= 80 ? '🎉' : accuracy >= 50 ? '💪' : '🌱'}</div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">{locale === 'zh' ? '听力完成！' : 'Listening Complete!'}</h2>
      <p className="text-sm text-gray-400 mb-4">{locale === 'zh' ? '你的成绩' : 'Your score'}</p>
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6 inline-flex items-center gap-2 text-sm">
        <span className="text-lg">🪙</span><span className="font-bold text-yellow-700">+{coinsEarned}</span><span className="text-yellow-500">{locale === 'zh' ? '金币' : 'coins'}</span>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-3"><div className="text-2xl font-bold text-green-600">{correct}</div><div className="text-xs text-green-500">✅ {locale === 'zh' ? '正确' : 'Correct'}</div></div>
        <div className="bg-red-50 rounded-xl p-3"><div className="text-2xl font-bold text-red-400">{questions.length - correct}</div><div className="text-xs text-red-400">❌ {locale === 'zh' ? '错误' : 'Wrong'}</div></div>
        <div className="bg-blue-50 rounded-xl p-3"><div className="text-2xl font-bold text-blue-500">{accuracy}%</div><div className="text-xs text-blue-400">📊 {locale === 'zh' ? '正确率' : 'Accuracy'}</div></div>
      </div>
      <button onClick={() => setStep('config')} className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors">
        {locale === 'zh' ? '再来一轮 🔄' : 'Another Round 🔄'}
      </button>
    </div>
  )
}
