'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCoins } from '@/lib/use-coins'

interface Question {
  word: string
  pinyin: string
  meaning: string
  options: string[]
  correctIndex: number
}

interface AdventureLevel {
  id: number
  name: string
  nameEn: string
  emoji: string
  description: string
  descriptionEn: string
  theme: string
  difficulty: number
  requiredEnergy: number
  totalQuestions: number
  rewards: {
    coins: { min: number; max: number }
    exp: number
  }
}

interface AdventureGameQuizProps {
  level: AdventureLevel
}

export default function AdventureGameQuiz({ level }: AdventureGameQuizProps) {
  const router = useRouter()
  const { add } = useCoins()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'completed' | 'failed'>('ready')
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [bossHp, setBossHp] = useState(3)
  const [maxBossHp, setMaxBossHp] = useState(3)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [rewards, setRewards] = useState<{ coins: number; exp: number } | null>(null)
  const [levelUp, setLevelUp] = useState(false)

  // Player stats from equipment
  const [playerStats, setPlayerStats] = useState({ power: 0, defense: 0, luck: 0 })

  // Calculate damage per hit based on power stat
  const damagePerHit = Math.max(1, 1 + Math.floor(playerStats.power / 15))

  // Calculate luck bonus percentage
  const luckBonus = Math.floor(playerStats.luck / 3)

  // Defense gives a shield that absorbs wrong answers
  const shieldCharges = Math.floor(playerStats.defense / 10)

  useEffect(() => {
    const initialize = async () => {
      try {
        // Fetch equipment stats
        const equipRes = await fetch('/api/adventure/equipment')
        const equipData = await equipRes.json()
        if (equipData.stats) {
          setPlayerStats(equipData.stats)
        }

        // Generate questions
        generateQuestions()
      } catch {
        generateQuestions()
      }
    }

    initialize()
  }, [level])

  function generateQuestions() {
    try {
      const stored = localStorage.getItem('chineselearn-words')
      const wordProgress = stored ? JSON.parse(stored) : []
      const wordList = wordProgress.slice(0, 30)

      if (wordList.length < 4) {
        throw new Error('Not enough words')
      }

      const shuffled = [...wordList].sort(() => Math.random() - 0.5)
      const selected = shuffled.slice(0, level.totalQuestions || 5)
      const generated: Question[] = selected.map((w: { word: string; pinyin: string; meaning: string }) => {
        const others = wordList
          .filter((o: { word: string }) => o.word !== w.word)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
        const allOptions = [w, ...others].sort(() => Math.random() - 0.5)
        const correctIndex = allOptions.findIndex((o: { word: string }) => o.word === w.word)
        return {
          word: w.word,
          pinyin: w.pinyin,
          meaning: w.meaning,
          options: allOptions.map((o: { word: string; meaning: string }) => o.meaning || o.word),
          correctIndex,
        }
      })

      setQuestions(generated.length > 0 ? generated : getFallbackQuestions())
    } catch {
      setQuestions(getFallbackQuestions())
    }

    const baseHp = 3 + level.difficulty
    setBossHp(baseHp)
    setMaxBossHp(baseHp)
    setLoading(false)
  }

  function getFallbackQuestions(): Question[] {
    return [
      { word: '你好', pinyin: 'nǐ hǎo', meaning: 'Hello', options: ['Hello', 'Goodbye', 'Thank you', 'Sorry'], correctIndex: 0 },
      { word: '学习', pinyin: 'xué xí', meaning: 'Study', options: ['Play', 'Study', 'Sleep', 'Eat'], correctIndex: 1 },
      { word: '朋友', pinyin: 'péng yǒu', meaning: 'Friend', options: ['Family', 'Teacher', 'Friend', 'Student'], correctIndex: 2 },
      { word: '快乐', pinyin: 'kuài lè', meaning: 'Happy', options: ['Sad', 'Angry', 'Happy', 'Tired'], correctIndex: 2 },
      { word: '熊猫', pinyin: 'xióng māo', meaning: 'Panda', options: ['Cat', 'Dog', 'Panda', 'Bear'], correctIndex: 2 },
      { word: '老师', pinyin: 'lǎo shī', meaning: 'Teacher', options: ['Student', 'Doctor', 'Teacher', 'Worker'], correctIndex: 2 },
      { word: '吃饭', pinyin: 'chī fàn', meaning: 'Eat', options: ['Drink', 'Cook', 'Eat', 'Buy'], correctIndex: 2 },
      { word: '喝水', pinyin: 'hē shuǐ', meaning: 'Drink water', options: ['Eat rice', 'Drink water', 'Run fast', 'Read book'], correctIndex: 1 },
      { word: '看书', pinyin: 'kàn shū', meaning: 'Read', options: ['Write', 'Read', 'Listen', 'Speak'], correctIndex: 1 },
      { word: '写字', pinyin: 'xiě zì', meaning: 'Write', options: ['Read', 'Draw', 'Write', 'Sing'], correctIndex: 2 },
    ]
  }

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(index)

    const correct = index === questions[currentQ]?.correctIndex
    setIsCorrect(correct)

    if (correct) {
      const newCombo = combo + 1
      setScore(score + 1)
      setCombo(newCombo)
      if (newCombo > maxCombo) setMaxCombo(newCombo)
      setCorrectCount(correctCount + 1)
      setBossHp(prev => Math.max(0, prev - damagePerHit))
    } else {
      setCombo(0)
    }

    setTimeout(() => {
      const newBossHp = correct ? Math.max(0, bossHp - damagePerHit) : bossHp

      if (correct && newBossHp <= 0) {
        // Level complete!
        completeLevel()
      } else if (currentQ >= questions.length - 1) {
        // Ran out of questions without defeating boss
        setGameState('failed')
      } else {
        setCurrentQ(currentQ + 1)
        setSelectedAnswer(null)
        setIsCorrect(null)
      }
    }, 1200)
  }

  const completeLevel = async () => {
    setGameState('completed')

    // Base coins + luck bonus
    const baseCoins = level.rewards.coins.min +
      Math.floor(Math.random() * (level.rewards.coins.max - level.rewards.coins.min))
    const luckCoins = Math.floor(baseCoins * luckBonus / 100)
    const totalCoins = baseCoins + luckCoins
    const expEarned = level.rewards.exp + Math.floor(10 * correctCount / Math.max(1, questions.length))

    setRewards({ coins: totalCoins, exp: expEarned })
    add(totalCoins)

    fetch('/api/adventure/levels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelId: level.id,
        action: 'complete',
        score,
        correctCount,
        totalCount: questions.length
      })
    }).then(async res => {
      const data = await res.json()
      if (data.levelUp) setLevelUp(true)
    })
  }

  const handleStart = async () => {
    setStarting(true)
    try {
      const res = await fetch('/api/adventure/levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levelId: level.id, action: 'start' })
      })
      const data = await res.json()
      if (data.success) {
        setGameState('playing')
      } else {
        setError(data.error || 'Not enough energy!')
      }
    } catch {
      setError('Failed to start level')
    }
    setStarting(false)
  }

  const retry = () => {
    setCurrentQ(0)
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setCorrectCount(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    const baseHp = 3 + level.difficulty
    setBossHp(baseHp)
    setMaxBossHp(baseHp)
    setGameState('ready')
    setRewards(null)
    setError(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐼</div>
          <p className="text-gray-500">Preparing adventure...</p>
        </div>
      </div>
    )
  }

  if (error && gameState === 'ready') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-6">😴</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{error}</h2>
        <div className="flex gap-3 justify-center mt-6">
          <button
            onClick={retry}
            className="px-6 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/adventure')}
            className="px-6 py-2 rounded-xl bg-gray-500 text-white hover:bg-gray-600"
          >
            Back to Map
          </button>
        </div>
      </div>
    )
  }

  // Start screen
  if (gameState === 'ready') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-8xl mb-6">{level.emoji}</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{level.name}</h1>
        <p className="text-gray-500 mb-2">{level.nameEn}</p>
        <p className="text-gray-600 mb-6">{level.description}</p>

        {/* Stats preview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-amber-500 text-xl">⚡</div>
              <div className="text-sm text-gray-600">-{level.requiredEnergy} energy</div>
            </div>
            <div>
              <div className="text-red-500 text-xl">💀</div>
              <div className="text-sm text-gray-600">Boss HP: {maxBossHp}</div>
            </div>
            <div>
              <div className="text-red-500 text-xl">⚔️</div>
              <div className="text-sm text-gray-600">DMG: {damagePerHit}/hit</div>
            </div>
            <div>
              <div className="text-amber-600 text-xl">💰</div>
              <div className="text-sm text-gray-600">{level.rewards.coins.min}-{level.rewards.coins.max} coins</div>
            </div>
          </div>
          {luckBonus > 0 && (
            <div className="mt-3 text-sm text-green-600">🍀 Luck bonus: +{luckBonus}% coins</div>
          )}
          {shieldCharges > 0 && (
            <div className="text-sm text-blue-600">🛡️ Shield: absorbs first {shieldCharges} wrong answer(s)</div>
          )}
        </div>

        {/* Stat Display */}
        <div className="flex justify-center gap-6 mb-6 text-sm">
          <span>⚔️ Power {playerStats.power}</span>
          <span>🛡️ Defense {playerStats.defense}</span>
          <span>🍀 Luck {playerStats.luck}</span>
        </div>

        <button
          onClick={handleStart}
          disabled={starting}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg hover:from-emerald-600 hover:to-green-700 shadow-lg disabled:from-gray-300 disabled:to-gray-300 transition-all"
        >
          {starting ? 'Starting...' : '⚔️ Start Challenge!'}
        </button>
      </div>
    )
  }

  // Completion screen
  if (gameState === 'completed' && rewards) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-8xl mb-6 animate-bounce">🎉</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Level Complete!</h1>
        <p className="text-xl text-gray-600 mb-2">{level.name} cleared!</p>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-amber-600">💰 {rewards.coins}</div>
              <div className="text-sm text-gray-500">Coins earned</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">✨ {rewards.exp}</div>
              <div className="text-sm text-gray-500">XP gained</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{correctCount}/{questions.length}</div>
              <div className="text-sm text-gray-500">Correct</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">{Math.round(correctCount / questions.length * 100)}%</div>
              <div className="text-sm text-gray-500">Accuracy</div>
            </div>
          </div>
          {luckBonus > 0 && (
            <div className="mt-2 text-xs text-green-600">
              🍀 Luck bonus added +{luckBonus}% extra coins
            </div>
          )}
          {levelUp && (
            <div className="mt-4 p-3 bg-purple-100 rounded-xl text-purple-700 font-bold">
              🎊 Level Up!
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={retry}
            className="px-6 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
          >
            Play Again
          </button>
          <button
            onClick={() => router.push('/adventure')}
            className="px-6 py-2 rounded-xl bg-gray-500 text-white hover:bg-gray-600"
          >
            Back to Map
          </button>
        </div>
      </div>
    )
  }

  // Fail screen
  if (gameState === 'failed') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-8xl mb-6">{level.emoji}</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Challenge Failed</h1>
        <p className="text-gray-600 mb-6">Don&apos;t give up! Try again!</p>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600">{correctCount}/{questions.length}</div>
              <div className="text-sm text-gray-500">Correct</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">{maxCombo}x</div>
              <div className="text-sm text-gray-500">Best combo</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">💀 Boss alive</div>
              <div className="text-sm text-gray-500">Need {damagePerHit} DMG per hit</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-500">⚔️ {playerStats.power} power</div>
              <div className="text-sm text-gray-500">Equip better gear!</div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={retry} className="px-6 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600">
            🔄 Try Again
          </button>
          <button onClick={() => router.push('/adventure/shop')} className="px-6 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600">
            🛍️ Buy Equipment
          </button>
        </div>
      </div>
    )
  }

  // Playing - the quiz
  const question = questions[currentQ]
  if (!question) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* HUD */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{level.emoji}</span>
            <span className="font-bold text-gray-800">{level.name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-red-500">⚔️ {damagePerHit}</span>
            <span className="text-gray-500">Q{currentQ + 1}/{questions.length}</span>
          </div>
        </div>

        {/* Boss HP Bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-red-500 font-medium">💀 Boss HP</span>
            <span className="text-gray-600">{bossHp}/{maxBossHp}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-500"
              style={{ width: `${(bossHp / maxBossHp) * 100}%` }}
            />
          </div>
        </div>

        {/* Combo counter */}
        {combo > 1 && (
          <div className="text-center text-orange-500 font-bold text-sm animate-pulse">
            🔥 {combo}x Combo!
          </div>
        )}
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6 text-center">
        <p className="text-sm text-gray-500 mb-2">What does this word mean?</p>
        <h2 className="text-4xl font-bold text-gray-800 mb-2">{question.word}</h2>
        <p className="text-lg text-gray-400">{question.pinyin}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {question.options.map((option, index) => {
          let btnClass = 'border-gray-200 hover:border-amber-400 bg-white'
          if (selectedAnswer !== null) {
            if (index === question.correctIndex) {
              btnClass = 'border-green-500 bg-green-50'
            } else if (index === selectedAnswer && !isCorrect) {
              btnClass = 'border-red-500 bg-red-50'
            } else {
              btnClass = 'border-gray-100 bg-gray-50 opacity-60'
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={selectedAnswer !== null}
              className={`p-5 rounded-xl border-2 text-left transition-all ${btnClass}`}
            >
              <span className="text-base text-gray-800 font-medium">
                {option}
              </span>
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {selectedAnswer !== null && (
        <div className={`mt-6 p-4 rounded-xl text-center font-bold ${
          isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {isCorrect ? `🎉 Correct! -${damagePerHit} HP` : '❌ Wrong!'}
          {!isCorrect && (
            <div className="text-sm font-normal mt-1 text-gray-600">
              Correct: {question.meaning}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
