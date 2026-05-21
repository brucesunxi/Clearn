'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { speak } from '@/lib/tts'
import { addCoins, syncCoinsToApi } from '@/lib/pet'
import type { Article } from '@/lib/types'
import { buildWordDatabase } from '@/lib/words'

type QuizType = 'zh2en' | 'en2zh'

interface QuizSessionProps {
  articles: Article[]
}

interface Question {
  word: string
  pinyin: string
  correctMeaning: string
  options: string[]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function QuizSession({ articles }: QuizSessionProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<'config' | 'playing' | 'result'>('config')
  const [quizType, setQuizType] = useState<QuizType>('zh2en')
  const [questionCount, setQuestionCount] = useState(5)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [answers, setAnswers] = useState<{ question: Question; chosen: string; correct: boolean }[]>([])

  const wordDb = useMemo(() => buildWordDatabase(articles), [articles])

  const generateQuestions = useCallback(
    (type: QuizType, count: number): Question[] => {
      const entries: { word: string; meaning: string; pinyin: string }[] = []
      wordDb.forEach((v) => {
        entries.push({
          word: v.word.word,
          meaning: v.word.meaning,
          pinyin: v.word.pinyin,
        })
      })

      const shuffled = shuffle(entries)
      const selectedEntries = shuffled.slice(0, Math.min(count, entries.length))
      const pool = entries

      return selectedEntries.map((entry) => {
        // Pick 3 random distractors from the pool (excluding the correct one)
        const distractors = shuffle(pool.filter((p) => p.meaning !== entry.meaning))
          .slice(0, 3)
          .map((p) => p.meaning)

        const correct = type === 'zh2en' ? entry.meaning : entry.word
        const options = shuffle([correct, ...distractors])

        return {
          word: entry.word,
          pinyin: entry.pinyin,
          correctMeaning: correct,
          options,
        }
      })
    },
    [wordDb]
  )

  const startQuiz = useCallback(() => {
    const qs = generateQuestions(quizType, questionCount)
    if (qs.length === 0) return
    setQuestions(qs)
    setCurrentIndex(0)
    setSelected(null)
    setShowResult(false)
    setCorrectCount(0)
    setAnswers([])
    setStep('playing')
  }, [generateQuestions, quizType, questionCount])

  const handleSelect = (option: string) => {
    if (showResult) return
    setSelected(option)
    setShowResult(true)

    const isCorrect = option === questions[currentIndex].correctMeaning
    if (isCorrect) setCorrectCount((c) => c + 1)

    setAnswers((prev) => [
      ...prev,
      {
        question: questions[currentIndex],
        chosen: option,
        correct: isCorrect,
      },
    ])
  }

  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1)
      setSelected(null)
      setShowResult(false)
    } else {
      // Award coins: 10 per correct answer
      const coinsEarned = correctCount * 10 + 20 // bonus 20 for finishing
      addCoins(coinsEarned)
      syncCoinsToApi(coinsEarned, 'quiz_complete', correctCount + '/' + questions.length + ' correct')
      setCoinsEarned(coinsEarned)
      setStep('result')
    }
  }

  const playWord = (word: string) => speak(word)

  // Config screen
  if (step === 'config') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">📝 Word Quiz</h2>
        <p className="text-sm text-gray-400 mb-6">Test your vocabulary with multiple choice questions</p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Question Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setQuizType('zh2en')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  quizType === 'zh2en'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                🇨🇳 Chinese → English
              </button>
              <button
                onClick={() => setQuizType('en2zh')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  quizType === 'en2zh'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                🇬🇧 English → Chinese
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Number of Questions</label>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    questionCount === n
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={startQuiz}
          className="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-base font-medium transition-colors shadow-sm"
        >
          Start Quiz 🎯
        </button>
      </div>
    )
  }

  // Playing screen
  if (step === 'playing') {
    const q = questions[currentIndex]
    const prompt = quizType === 'zh2en' ? q.word : q.correctMeaning

    return (
      <div>
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>{currentIndex + 1} / {questions.length}</span>
            <span>✅ {correctCount}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentIndex / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="text-center mb-6">
            {quizType === 'zh2en' && (
              <button
                onClick={() => playWord(q.word)}
                className="text-5xl font-bold text-gray-800 mb-2 hover:text-orange-500 transition-colors cursor-pointer"
                title="Click to hear pronunciation"
              >
                {q.word} 🔊
              </button>
            )}
            {quizType === 'zh2en' && (
              <p className="text-base text-gray-400">{q.pinyin}</p>
            )}
            {quizType === 'en2zh' && (
              <p className="text-3xl font-bold text-gray-800 mb-2">{q.correctMeaning}</p>
            )}
            <p className="text-sm text-gray-400 mt-2">Choose the correct answer</p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {q.options.map((option, i) => {
              let btnClass =
                'w-full py-3.5 rounded-xl text-base font-medium border-2 transition-all duration-200 '

              if (!showResult) {
                btnClass +=
                  'border-gray-100 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
              } else if (option === q.correctMeaning) {
                btnClass += 'border-green-500 bg-green-50 text-green-700'
              } else if (option === selected && option !== q.correctMeaning) {
                btnClass += 'border-red-400 bg-red-50 text-red-600'
              } else {
                btnClass += 'border-gray-100 bg-gray-50 text-gray-400'
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(option)}
                  disabled={showResult}
                  className={btnClass}
                >
                  {option}
                  {showResult && option === q.correctMeaning && ' ✅'}
                  {showResult && option === selected && option !== q.correctMeaning && ' ❌'}
                </button>
              )
            })}
          </div>

          {/* Next button */}
          {showResult && (
            <button
              onClick={nextQuestion}
              className="mt-6 w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-base font-medium transition-colors"
            >
              {currentIndex + 1 < questions.length ? 'Next →' : 'See Results 📊'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // Results screen
  const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
      <div className="text-4xl mb-4">
        {accuracy >= 80 ? '🎉' : accuracy >= 50 ? '💪' : '🌱'}
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Quiz Complete!</h2>
      <p className="text-sm text-gray-400 mb-4">Your score</p>

      {/* Coins earned */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6 inline-flex items-center gap-2 text-sm">
        <span className="text-lg">🪙</span>
        <span className="font-bold text-yellow-700">+{coinsEarned}</span>
        <span className="text-yellow-500">coins earned!</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-green-600">{correctCount}</div>
          <div className="text-xs text-green-500">✅ Correct</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-red-400">{questions.length - correctCount}</div>
          <div className="text-xs text-red-400">❌ Wrong</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-blue-500">{accuracy}%</div>
          <div className="text-xs text-blue-400">📊 Accuracy</div>
        </div>
      </div>

      {/* Wrong answers review */}
      {answers.filter((a) => !a.correct).length > 0 && (
        <div className="mb-6 text-left">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Review wrong answers:</h3>
          <div className="space-y-2">
            {answers
              .filter((a) => !a.correct)
              .map((a, i) => (
                <div key={i} className="bg-red-50 rounded-lg px-3 py-2 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-700">{a.question.word}</span>
                    <span className="text-sm text-gray-400 ml-2">({a.question.pinyin})</span>
                  </div>
                  <span className="text-sm text-green-600">{a.question.correctMeaning}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setStep('config')}
        className="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-base font-medium transition-colors"
      >
        Another Quiz 🔄
      </button>
    </div>
  )
}
