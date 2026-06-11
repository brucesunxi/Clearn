'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import Flashcard from './Flashcard'
import type { Article, VocabularyItem } from '@/lib/types'
import { buildWordDatabase, getNewWords, getReviewWords, recordAnswer } from '@/lib/words'
import { doCheckIn, incrementTodayProgress } from '@/lib/checkin'
import { addCoins, syncCoinsToApi } from '@/lib/pet'
import { trackActivity } from '@/lib/activity'
import { useAuth } from '@/lib/auth-context'
import { hasSignupModalBeenShown, markSignupModalShown } from '@/lib/signup-guard'
import SignupModal from './SignupModal'

interface FlashcardSessionProps {
  articles: Article[]
  onComplete?: () => void
}

interface SessionCard {
  id: string
  word: VocabularyItem
  articleId: string
  level: number
  type: 'new' | 'review'
  correct: boolean | null
  wrongCount: number
}

const EBBINGHAUS_INTERVALS = [0, 1, 2, 4, 7, 15, 30, 90]
const MAX_ATTEMPTS = 3

export default function FlashcardSession({ articles, onComplete }: FlashcardSessionProps) {
  const { t, locale } = useTranslation()
  const { user } = useAuth()
  const [step, setStep] = useState<'config' | 'learning' | 'summary'>('config')
  const [newCount, setNewCount] = useState(5)
  const [reviewCount, setReviewCount] = useState(5)
  const [cards, setCards] = useState<SessionCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<SessionCard[]>([])
  const [totalStarted, setTotalStarted] = useState(0)
  const [signupShown, setSignupShown] = useState(false)
  const [signupBlocked, setSignupBlocked] = useState(false)

  const wordDb = useMemo(() => buildWordDatabase(articles), [articles])

  const startSession = useCallback(() => {
    const news = getNewWords(wordDb, newCount).map((w) => ({
      ...w,
      type: 'new' as const,
      correct: null,
      wrongCount: 0,
    }))
    const reviews = getReviewWords(reviewCount).map((w) => ({
      ...w,
      type: 'review' as const,
      correct: null,
      wrongCount: 0,
    }))

    const allCards = [...news, ...reviews].sort(() => Math.random() - 0.5)

    if (allCards.length === 0) {
      setStep('summary')
      return
    }

    setCards(allCards)
    setCurrentIndex(0)
    setResults([])
    setTotalStarted(allCards.length)
    setStep('learning')
  }, [wordDb, newCount, reviewCount])

  const handleSignupClose = () => {
    setSignupShown(false)
    markSignupModalShown()
    setCurrentIndex(currentIndex + 1)
  }

  const handleResult = useCallback(
    (correct: boolean) => {
      const idx = currentIndex
      const card = cards[idx]
      if (!card) return

      if (correct) {
        recordAnswer(card.id, card.word, card.articleId, true)
        setResults((prev) => [...prev, { ...card, correct: true }])

        if (idx + 1 >= cards.length) {
          doCheckIn()
          incrementTodayProgress(cards.length)
          addCoins(20)
          syncCoinsToApi(20, 'study_complete', correctCount + ' correct, ' + wrongCount + ' wrong')
          onComplete?.()
          const cr = results.filter(r => r.correct === true).length + (correct ? 1 : 0)
          trackActivity('study_complete', { correct: cr, wrong: results.length + 1 - cr, total: cards.length, accuracy: Math.round((cr / (results.length + 1)) * 100) })
          fetch('/api/adventure/energy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activity: 'study_complete' }) }).catch(() => {})
          setStep('summary')
        } else {
          if (idx === 2 && !user) {
            signupGuardCheck()
            return
          }
          setCurrentIndex(idx + 1)
        }
      } else {
        const wc = card.wrongCount || 0

        if (wc + 1 >= MAX_ATTEMPTS) {
          recordAnswer(card.id, card.word, card.articleId, false)
          setResults((prev) => [...prev, { ...card, correct: false, wrongCount: wc + 1 }])

          if (idx + 1 >= cards.length) {
            doCheckIn()
            incrementTodayProgress(cards.length)
            onComplete?.()
            const cr = results.filter(r => r.correct === true).length
            trackActivity('study_complete', { correct: cr, wrong: results.length + 1 - cr, total: cards.length, accuracy: Math.round((cr / (results.length + 1)) * 100) })
            fetch('/api/adventure/energy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activity: 'study_complete' }) }).catch(() => {})
            setStep('summary')
          } else {
            if (idx === 2 && !user) {
              signupGuardCheck()
              return
            }
            setCurrentIndex(idx + 1)
          }
        } else {
          const offset = 3 + wc * 2
          const insertAt = Math.min(idx + 1 + offset, cards.length)

          setCards((prev) => {
            const newCards = [...prev]
            newCards.splice(insertAt, 0, {
              ...card,
              wrongCount: wc + 1,
              id: card.id + '_r' + (wc + 1),
            })
            return newCards
          })
          if (idx === 2 && !user) {
            signupGuardCheck()
            return
          }
          setCurrentIndex(idx + 1)
        }
      }
    },
    [cards, currentIndex, onComplete, user]
  )

  function signupGuardCheck() {
    if (hasSignupModalBeenShown()) {
      setSignupBlocked(true)
    } else {
      setSignupShown(true)
    }
  }

  const correctCount = results.filter((r) => r.correct === true).length
  const wrongCount = results.filter((r) => r.correct === false).length
  const totalDone = results.length
  const accuracy = totalDone > 0 ? Math.round((correctCount / totalDone) * 100) : 0

  if (signupBlocked) {
    return <SignupModal type="register" locale={locale} onClose={() => {}} />
  }

  if (step === 'config') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{t('session.config.title')} 📚</h2>
        <p className="text-sm text-gray-400 mb-6">{t('session.config.desc')}</p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">{t('session.newWords')}</label>
            <div className="flex gap-2">
              {[3, 5, 10, 15].map((n) => (
                <button
                  key={n}
                  onClick={() => setNewCount(n)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    newCount === n
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">{t('session.reviewWords')}</label>
            <div className="flex gap-2">
              {[3, 5, 10, 15].map((n) => (
                <button
                  key={n}
                  onClick={() => setReviewCount(n)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    reviewCount === n
                      ? 'bg-blue-500 text-white'
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
          onClick={startSession}
          className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-base font-medium transition-colors shadow-sm"
        >
          {t('session.start')} 🚀
        </button>
      </div>
    )
  }

  if (step === 'learning') {
    const currentCard = cards[currentIndex]
    return (
      <>
        {signupShown && <SignupModal type="register" locale={locale} onClose={handleSignupClose} />}
        <div>
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>
              {totalDone} / {totalStarted} {t('session.completed')}
            </span>
            <span className="flex items-center gap-3">
              {currentCard.wrongCount > 0 && (
                <span className="text-orange-500">
                  💪 {t('session.attempt', { n: currentCard.wrongCount + 1 })}
                </span>
              )}
              <span>
                {currentCard.type === 'new'
                  ? `🆕 ${t('flashcard.tip.newWord')}`
                  : `🔄 ${t('flashcard.tip.review')}`}
              </span>
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalStarted > 0 ? (totalDone / totalStarted) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-300 mt-1">{t('session.remaining', { n: cards.length - currentIndex - 1 })}</p>
        </div>
        <Flashcard key={currentCard.id} word={currentCard.word} onResult={handleResult} />
      </div>
      </>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
      <div className="text-4xl mb-4">
        {accuracy >= 80 ? '🎉' : accuracy >= 50 ? '💪' : '🌱'}
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">{t('session.completed')}</h2>
      <p className="text-sm text-gray-400 mb-6">{t('session.todaysResult')}</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-green-600">{correctCount}</div>
          <div className="text-xs text-green-500">✅ {t('session.correct')}</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-red-400">{wrongCount}</div>
          <div className="text-xs text-red-400">❌ {t('session.wrong')}</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-blue-500">{accuracy}%</div>
          <div className="text-xs text-blue-400">📊 {t('session.accuracy')}</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
        <h3 className="text-sm font-medium text-gray-600 mb-2">🧠 {t('session.ebbinghaus.title')}</h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          {EBBINGHAUS_INTERVALS.slice(1).map((days, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium ${
                  i < 3 ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-300'
                }`}
              >
                {days}d
              </div>
              {i < EBBINGHAUS_INTERVALS.slice(1).length - 1 && <div className="w-2 h-px bg-gray-200" />}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">{t('session.ebbinghaus.desc')}</p>
      </div>

      {results.filter((r) => r.correct === false).length > 0 && (
        <div className="mb-6 text-left">
          <h3 className="text-sm font-medium text-gray-600 mb-2">{t('session.needReview')}</h3>
          <div className="space-y-2">
            {results
              .filter((r) => r.correct === false)
              .map((r, i) => (
                <div key={i} className="bg-red-50 rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="font-medium text-gray-700">{r.word.word}</span>
                  <span className="text-sm text-gray-400">{r.word.meaning}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* What's next */}
      <div className="mb-6 text-left">
        <h3 className="text-sm font-medium text-gray-600 mb-3">🎯 {locale === 'zh' ? '接下来做什么？' : 'What\'s next?'}</h3>
        <div className="flex flex-wrap gap-2">
          <a href="/pet"
            className="flex-1 min-w-[100px] px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium text-center transition-colors">
            🐼 {locale === 'zh' ? (correctCount > 0 ? '看熊猫 +加油' : '看看熊猫') : (correctCount > 0 ? 'Visit panda +cheer' : 'Visit panda')}
          </a>
          <a href="/practice"
            className="flex-1 min-w-[100px] px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium text-center transition-colors">
            🎧 {locale === 'zh' ? '听力练习' : 'Listening'}
          </a>
          <a href="/stats"
            className="flex-1 min-w-[100px] px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium text-center transition-colors">
            📊 {locale === 'zh' ? '学习统计' : 'Statistics'}
          </a>
        </div>
      </div>

      <button
        onClick={() => setStep('config')}
        className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-base font-medium transition-colors"
      >
        {t('session.again')} 🔄
      </button>
    </div>
  )
}
