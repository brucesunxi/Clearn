'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { speak } from '@/lib/tts'
import { addCoins } from '@/lib/pet'
import type { Article } from '@/lib/types'
import { buildWordDatabase } from '@/lib/words'

interface SpeakSessionProps {
  articles: Article[]
}

interface SpeakCard {
  word: string
  pinyin: string
  meaning: string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function SpeakSession({ articles }: SpeakSessionProps) {
  const { t, locale } = useTranslation()
  const [step, setStep] = useState<'config' | 'playing' | 'result'>('config')
  const [count, setCount] = useState(5)
  const [cards, setCards] = useState<SpeakCard[]>([])
  const [idx, setIdx] = useState(0)
  const [status, setStatus] = useState<'idle' | 'listening' | 'checking' | 'done'>('idle')
  const [heard, setHeard] = useState('')
  const [result, setResult] = useState<boolean | null>(null)
  const [correct, setCorrect] = useState(0)
  const [coinsEarned, setCoinsEarned] = useState(0)
  const recognitionRef = useRef<any>(null)
  const resultsRef = useRef<{ card: SpeakCard; correct: boolean }[]>([])

  const wordDb = useMemo(() => buildWordDatabase(articles), [articles])

  const buildCards = useCallback((n: number): SpeakCard[] => {
    const entries: SpeakCard[] = []
    wordDb.forEach((v) => entries.push({ word: v.word.word, pinyin: v.word.pinyin, meaning: v.word.meaning }))
    return shuffle(entries).slice(0, Math.min(n, entries.length))
  }, [wordDb])

  const start = useCallback(() => {
    const c = buildCards(count)
    if (!c.length) return
    setCards(c); setIdx(0); setCorrect(0); setCoinsEarned(0)
    resultsRef.current = []
    setStatus('idle'); setHeard(''); setResult(null)
    setStep('playing')
  }, [buildCards, count])

  const playWord = () => { if (cards[idx]) speak(cards[idx].word) }

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert(locale === 'zh' ? '您的浏览器不支持语音识别，请使用 Chrome。' : 'Speech recognition not supported. Please use Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setStatus('listening')
    recognition.onerror = () => { setStatus('idle'); alert(locale === 'zh' ? '无法识别语音，请重试。' : 'Could not recognize speech. Try again.') }
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim()
      setHeard(transcript)
      setStatus('checking')

      const expected = cards[idx].word
      const isCorrect = transcript === expected

      setTimeout(() => {
        setResult(isCorrect)
        setStatus('done')
        if (isCorrect) setCorrect((c) => c + 1)
        resultsRef.current.push({ card: cards[idx], correct: isCorrect })
      }, 500)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
    }
    setStatus('idle')
  }

  const next = () => {
    if (idx + 1 < cards.length) {
      setIdx((i) => i + 1); setHeard(''); setResult(null); setStatus('idle')
    } else {
      const earned = correct * 15 + 30
      addCoins(earned); setCoinsEarned(earned); setStep('result')
    }
  }

  if (step === 'config') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">🗣️ {locale === 'zh' ? '口语练习' : 'Speaking Practice'}</h2>
        <p className="text-sm text-gray-400 mb-6">{locale === 'zh' ? '看中文，说出对应的词' : 'See the word, say it aloud!'}</p>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">{locale === 'zh' ? '单词数量' : 'Words'}</label>
          <div className="flex gap-2">
            {[3, 5, 10, 15].map((n) => (
              <button key={n} onClick={() => setCount(n)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${count === n ? 'bg-red-500 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>{n}</button>
            ))}
          </div>
        </div>
        <button onClick={start} className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors shadow-sm">
          {locale === 'zh' ? '开始口语 🗣️' : 'Start Speaking 🗣️'}
        </button>
      </div>
    )
  }

  if (step === 'playing') {
    const card = cards[idx]
    return (
      <div>
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>{idx + 1} / {cards.length}</span>
          <span>✅ {correct}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
          <div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${(idx / cards.length) * 100}%` }} />
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="text-5xl font-bold text-gray-800 mb-2">{card.word}</div>
          <p className="text-gray-400 mb-1">{card.pinyin}</p>
          <p className="text-gray-500 mb-6">{card.meaning}</p>

          <button onClick={playWord} className="text-sm text-gray-400 hover:text-orange-500 mb-6 inline-flex items-center gap-1">
            🔊 {locale === 'zh' ? '听示范发音' : 'Hear pronunciation'}
          </button>

          {/* Mic button area */}
          {status === 'idle' && (
            <button onClick={startListening}
              className="w-20 h-20 mx-auto rounded-full bg-red-100 hover:bg-red-200 text-red-500 text-3xl flex items-center justify-center transition-all hover:scale-110 mb-4">
              🎤
            </button>
          )}
          {status === 'listening' && (
            <div className="w-20 h-20 mx-auto rounded-full bg-red-500 text-white text-3xl flex items-center justify-center animate-ping-slow mb-4 cursor-pointer" onClick={stopListening}>
              🎤
            </div>
          )}
          {(status === 'checking' || status === 'done') && (
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 ${result ? 'bg-green-100' : status === 'done' ? 'bg-red-100' : 'bg-gray-100'}`}>
              {result === true ? '✅' : result === false ? '❌' : '⏳'}
            </div>
          )}

          {status === 'idle' && (
            <p className="text-xs text-gray-400">{locale === 'zh' ? '点击麦克风，读出这个中文词' : 'Tap the mic and say this word aloud'}</p>
          )}
          {status === 'listening' && (
            <p className="text-xs text-red-500 animate-pulse">{locale === 'zh' ? '🎤 正在听你说...' : '🎤 Listening...'}</p>
          )}
          {status === 'done' && (
            <div className="mt-2">
              <p className={`text-sm ${result ? 'text-green-600' : 'text-red-600'}`}>
                {result
                  ? (locale === 'zh' ? '🎉 发音正确！' : '🎉 Correct!')
                  : (locale === 'zh' ? `听到的是：「${heard}」，应该是：「${card.word}」` : `Heard: "${heard}", expected: "${card.word}"`)}
              </p>
              {!result && (
                <div className="mt-3 bg-orange-50 rounded-xl p-3">
                  <p className="text-xs text-orange-500 font-medium mb-1">💡 {locale === 'zh' ? '记忆技巧' : 'Memory Tip'}</p>
                  <p className="text-sm text-gray-600">
                    {locale === 'zh' ? `试试慢一点说：「${card.word}」` : `Try saying it slowly: "${card.word}" (${card.pinyin})`}
                  </p>
                </div>
              )}
              <button onClick={next}
                className="mt-4 w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors">
                {idx + 1 < cards.length ? (locale === 'zh' ? '下一题 →' : 'Next →') : (locale === 'zh' ? '查看成绩 📊' : 'See Results 📊')}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const accuracy = cards.length > 0 ? Math.round((correct / cards.length) * 100) : 0
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
      <div className="text-4xl mb-4">{accuracy >= 80 ? '🎉' : accuracy >= 50 ? '💪' : '🌱'}</div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">{locale === 'zh' ? '口语练习完成！' : 'Speaking Complete!'}</h2>
      <p className="text-sm text-gray-400 mb-4">{locale === 'zh' ? '你的成绩' : 'Your score'}</p>
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6 inline-flex items-center gap-2 text-sm">
        <span className="text-lg">🪙</span><span className="font-bold text-yellow-700">+{coinsEarned}</span><span className="text-yellow-500">{locale === 'zh' ? '金币' : 'coins'}</span>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-3"><div className="text-2xl font-bold text-green-600">{correct}</div><div className="text-xs text-green-500">✅ {locale === 'zh' ? '正确' : 'Correct'}</div></div>
        <div className="bg-red-50 rounded-xl p-3"><div className="text-2xl font-bold text-red-400">{cards.length - correct}</div><div className="text-xs text-red-400">❌ {locale === 'zh' ? '继续加油' : 'Keep trying'}</div></div>
        <div className="bg-blue-50 rounded-xl p-3"><div className="text-2xl font-bold text-blue-500">{accuracy}%</div><div className="text-xs text-blue-400">📊 {locale === 'zh' ? '正确率' : 'Accuracy'}</div></div>
      </div>
      <button onClick={() => setStep('config')} className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors">
        {locale === 'zh' ? '再来一轮 🔄' : 'Another Round 🔄'}
      </button>
    </div>
  )
}
