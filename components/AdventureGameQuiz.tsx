'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

const REVIVE_COST = 50

export default function AdventureGameQuiz({ level }: AdventureGameQuizProps) {
  const router = useRouter()
  const { balance, refresh } = useCoins()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'completed' | 'failed'>('ready')
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [bossHp, setBossHp] = useState(3)
  const [maxBossHp, setMaxBossHp] = useState(3)
  const [playerHp, setPlayerHp] = useState(3)
  const [maxPlayerHp, setMaxPlayerHp] = useState(3)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [rewards, setRewards] = useState<{ coins: number; exp: number } | null>(null)
  const [levelUp, setLevelUp] = useState(false)
  const [doubleXp, setDoubleXp] = useState(false)
  const [droppedItem, setDroppedItem] = useState<{ name: string; emoji: string } | null>(null)
  const [authState, setAuthState] = useState<'loading' | 'anon' | 'authenticated'>('loading')

  // Check auth on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setAuthState(d.user ? 'authenticated' : 'anon'))
      .catch(() => setAuthState('anon'))
  }, [])

  // Player stats from equipment
  const [playerStats, setPlayerStats] = useState({ power: 0, defense: 0, luck: 0 })

  // Calculate damage based on stats
  const damagePerHit = Math.max(1, 1 + Math.floor(playerStats.power / 15))

  // Defense reduces damage taken (min 1)
  const damageTaken = Math.max(1, 2 - Math.floor(playerStats.defense / 10))

  // Luck bonus for coins
  const luckBonus = Math.floor(playerStats.luck / 3)

  // Total questions answered (including from shuffled deck)
  const [answeredCount, setAnsweredCount] = useState(0)

  useEffect(() => {
    const initialize = async () => {
      try {
        const equipRes = await fetch('/api/adventure/equipment')
        const equipData = await equipRes.json()
        if (equipData.stats) {
          setPlayerStats(equipData.stats)
        }
        generateQuestions()
      } catch {
        generateQuestions()
      }
    }
    initialize()
  }, [level])

  function generateQuestions() {
    let wordList: any[] = []
    try {
      const stored = localStorage.getItem('chineselearn-words')
      wordList = stored ? JSON.parse(stored) : []
    } catch {}

    if (wordList.length < 4) {
      wordList = []
    }

    const allQ = wordList.length > 0 ? buildQuestions(wordList) : getFallbackQuestions()
    setAllQuestions(allQ)
    drawQuestions(allQ)

    const baseHp = 3 + level.difficulty
    setBossHp(baseHp)
    setMaxBossHp(baseHp)
    setPlayerHp(3)
    setMaxPlayerHp(3)
    setLoading(false)
  }

  function buildQuestions(wordList: any[]): Question[] {
    const shuffled = [...wordList].sort(() => Math.random() - 0.5)
    const pool = shuffled.slice(0, 30)
    return pool.map((w: { word: string; pinyin: string; meaning: string }, i: number) => {
      const others = pool
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
  }

  function drawQuestions(pool: Question[]) {
    const count = Math.min(level.totalQuestions || 5, pool.length)
    const drawn = [...pool].sort(() => Math.random() - 0.5).slice(0, count)
    setQuestions(drawn)
    setCurrentQ(0)
    setAnsweredCount(0)
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
    setAnsweredCount(prev => prev + 1)

    const correct = index === questions[currentQ]?.correctIndex
    setIsCorrect(correct)

    if (correct) {
      const newCombo = combo + 1
      setCombo(newCombo)
      if (newCombo > maxCombo) setMaxCombo(newCombo)
      setCorrectCount(prev => prev + 1)
      setBossHp(prev => Math.max(0, prev - damagePerHit))
    } else {
      setCombo(0)
      // Player takes damage on wrong answer
      setPlayerHp(prev => Math.max(0, prev - damageTaken))
    }

    setTimeout(() => {
      const newBossHp = correct ? Math.max(0, bossHp - damagePerHit) : bossHp
      const newPlayerHp = correct ? playerHp : Math.max(0, playerHp - damageTaken)

      if (correct && newBossHp <= 0) {
        completeLevel(correctCount + 1, answeredCount + 1)
      } else if (!correct && newPlayerHp <= 0) {
        // Player defeated! Notify server
        setGameState('failed')
        fetch('/api/adventure/levels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ levelId: level.id, action: 'level_failure' })
        }).catch(() => {})
      } else if (currentQ >= questions.length - 1) {
        // Out of questions - check if we can draw more
        const remaining = allQuestions.filter(q => !questions.includes(q))
        if (remaining.length > 0 && newBossHp > 0) {
          // Draw more questions
          const extra = remaining.sort(() => Math.random() - 0.5).slice(0, level.totalQuestions || 5)
          setQuestions(extra)
          setCurrentQ(0)
          setSelectedAnswer(null)
          setIsCorrect(null)
        } else {
          // Truly out of questions
          setGameState('failed')
          fetch('/api/adventure/levels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ levelId: level.id, action: 'level_failure' })
          }).catch(() => {})
        }
      } else {
        setCurrentQ(prev => prev + 1)
        setSelectedAnswer(null)
        setIsCorrect(null)
      }
    }, 1200)
  }

  const completeLevel = async (finalCorrect?: number, finalAnswered?: number) => {
    setGameState('completed')

    const res = await fetch('/api/adventure/levels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelId: level.id,
        action: 'complete',
        score: finalCorrect ?? correctCount,
        correctCount: finalCorrect ?? correctCount,
        totalCount: finalAnswered ?? (answeredCount || questions.length)
      })
    })
    const data = await res.json()
    if (data.rewards) {
      setRewards({ coins: data.rewards.coins, exp: data.rewards.exp })
      refresh() // Refresh coins display
    }
    if (data.levelUp) setLevelUp(true)
    if (data.doubleXp) setDoubleXp(true)
    if (data.droppedItem) {
      const shopRes = await fetch('/api/adventure/equipment').then(r => r.json())
      const item = shopRes.shop?.find((i: { id: string }) => i.id === data.droppedItem)
      if (item) setDroppedItem({ name: item.name, emoji: item.emoji })
    }
  }

  const handleRevive = async () => {
    const res = await fetch('/api/adventure/levels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ levelId: level.id, action: 'revive' })
    })
    const data = await res.json()
    if (data.success) {
      // Restore state: half boss HP, full player HP, fresh questions
      setBossHp(Math.max(1, Math.floor(maxBossHp / 2)))
      setPlayerHp(maxPlayerHp)
      setCombo(0)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setGameState('playing')

      // Generate fresh questions
      const stored = localStorage.getItem('chineselearn-words')
      const wordList = stored ? JSON.parse(stored) : []
      const pool = wordList.length > 0
        ? (() => {
            const shuffled = [...wordList].sort(() => Math.random() - 0.5)
            return shuffled.slice(0, 30).map((w: { word: string; pinyin: string; meaning: string }) => {
              const others = shuffled.filter((o: { word: string }) => o.word !== w.word).sort(() => Math.random() - 0.5).slice(0, 3)
              const allOptions = [w, ...others].sort(() => Math.random() - 0.5)
              const correctIndex = allOptions.findIndex((o: { word: string }) => o.word === w.word)
              return {
                word: w.word, pinyin: w.pinyin, meaning: w.meaning,
                options: allOptions.map((o: { word: string; meaning: string }) => o.meaning || o.word),
                correctIndex,
              }
            })
          })()
        : getFallbackQuestions()
      const drawn = pool.sort(() => Math.random() - 0.5).slice(0, level.totalQuestions || 5)
      setQuestions(drawn)
      setCurrentQ(0)
      setAllQuestions(pool)
    }
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
    const baseHp = 3 + level.difficulty
    setBossHp(baseHp)
    setMaxBossHp(baseHp)
    setPlayerHp(3)
    setMaxPlayerHp(3)
    setCombo(0)
    setMaxCombo(0)
    setCorrectCount(0)
    setAnsweredCount(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setGameState('ready')
    setRewards(null)
    setLevelUp(false)
    setDoubleXp(false)
    setDroppedItem(null)
    setError(null)
    generateQuestions()
  }

  if (loading || authState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐼</div>
          <p className="text-gray-500">Preparing adventure...</p>
        </div>
      </div>
    )
  }

  if (authState === 'anon') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-8xl mb-6">🔒</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Login Required</h1>
        <p className="text-gray-500 mb-6">Sign in to play adventures!</p>
        <div className="flex flex-col gap-3">
          <Link href="/register" className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg">
            🚀 Sign Up
          </Link>
          <Link href="/login" className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all text-sm">
            Log In
          </Link>
          <Link href="/adventure" className="text-sm text-gray-400 hover:text-gray-600">
            ← Back to map
          </Link>
        </div>
      </div>
    )
  }

  if (error && gameState === 'ready') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-6">😴</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{error}</h2>
        <p className="text-sm text-gray-500 mt-2">
          {error.includes('power') || error.includes('defense') || error.includes('equipment')
            ? 'You need better equipment to challenge this level!'
            : 'Complete learning activities to restore energy!'}
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <button onClick={retry} className="px-6 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600">Try Again</button>
          {error.includes('power') || error.includes('defense') || error.includes('equipment') ? (
            <button onClick={() => router.push('/adventure/shop')} className="px-6 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600">🛍️ Go to Shop</button>
          ) : (
            <button onClick={() => router.push('/adventure')} className="px-6 py-2 rounded-xl bg-gray-500 text-white hover:bg-gray-600">Back to Map</button>
          )}
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
          {luckBonus > 0 && <div className="mt-3 text-sm text-green-600">🍀 Luck bonus: +{luckBonus}% coins</div>}
          {damageTaken < 2 && <div className="text-sm text-blue-600">🛡️ Damage reduced to {damageTaken} per wrong answer</div>}
        </div>

        <div className="flex justify-center gap-6 mb-6 text-sm">
          <span>⚔️ Power {playerStats.power} (DMG {damagePerHit})</span>
          <span>🛡️ Defense {playerStats.defense} (DMG taken {damageTaken})</span>
          <span>🍀 Luck {playerStats.luck} (+{luckBonus}% coins)</span>
        </div>

        <details className="mb-6 text-left bg-blue-50 rounded-xl p-4">
          <summary className="text-sm font-medium text-blue-700 cursor-pointer">📖 How to play</summary>
          <div className="mt-3 text-sm text-gray-600 space-y-2">
            <p>❓ Answer <strong>multiple-choice</strong> questions about Chinese vocabulary</p>
            <p>⚔️ Correct answer deals <strong>{damagePerHit} DMG</strong> to the boss</p>
            <p>🛡️ Wrong answer: panda takes <strong>{damageTaken} DMG</strong></p>
            <p>🔥 Get <strong>consecutive correct</strong> answers for a combo streak!</p>
            <p>🎯 Defeat the boss to clear the level</p>
            <p>💀 If your HP reaches 0, you can <strong>revive for 50 coins</strong></p>
          </div>
        </details>

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
              <div className="text-3xl font-bold text-green-600">{correctCount}/{answeredCount || questions.length}</div>
              <div className="text-sm text-gray-500">Correct</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">{Math.round(correctCount / Math.max(1, answeredCount || questions.length) * 100)}%</div>
              <div className="text-sm text-gray-500">Accuracy</div>
            </div>
          </div>
          {doubleXp && (
            <div className="mt-3 p-2 bg-yellow-100 rounded-xl text-yellow-700 font-bold text-sm">✨ DOUBLE XP - First daily level!</div>
          )}
          {droppedItem && (
            <div className="mt-2 p-2 bg-green-100 rounded-xl text-green-700 font-medium text-sm">
              🎁 Item dropped: {droppedItem.emoji} {droppedItem.name}!
            </div>
          )}
          {luckBonus > 0 && (
            <div className="mt-1 text-xs text-green-600">🍀 Luck bonus +{luckBonus}% extra coins</div>
          )}
          {levelUp && (
            <div className="mt-3 p-3 bg-purple-100 rounded-xl text-purple-700 font-bold">🎊 Level Up!</div>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={retry} className="px-6 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600">Play Again</button>
          <button onClick={() => router.push('/adventure')} className="px-6 py-2 rounded-xl bg-gray-500 text-white hover:bg-gray-600">Back to Map</button>
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
              <div className="text-3xl font-bold text-green-600">{correctCount}/{answeredCount || questions.length}</div>
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
          {/* Revive button */}
          <button
            onClick={handleRevive}
            disabled={balance < REVIVE_COST}
            className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-300 transition-all shadow-lg"
          >
            {balance >= REVIVE_COST
              ? `💀 Revive (${REVIVE_COST} coins) - Continue fighting!`
              : `Not enough coins for revive (need ${REVIVE_COST})`
            }
          </button>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={retry} className="px-6 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600">🔄 Try Again</button>
          <button onClick={() => router.push('/adventure/shop')} className="px-6 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600">🛍️ Buy Equipment</button>
        </div>
      </div>
    )
  }

  // Playing
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
            <span className="text-red-500 font-medium">💀 Boss</span>
            <span className="text-gray-600">{bossHp}/{maxBossHp}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-500" style={{ width: `${(bossHp / maxBossHp) * 100}%` }} />
          </div>
        </div>

        {/* Player HP Bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-blue-500 font-medium">🐼 Panda</span>
            <span className="text-gray-600">{playerHp}/{maxPlayerHp}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500" style={{ width: `${(playerHp / maxPlayerHp) * 100}%` }} />
          </div>
        </div>

        {/* Combo */}
        {combo > 1 && (
          <div className="text-center text-orange-500 font-bold text-sm animate-pulse">🔥 {combo}x Combo!</div>
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
            if (index === question.correctIndex) btnClass = 'border-green-500 bg-green-50'
            else if (index === selectedAnswer && !isCorrect) btnClass = 'border-red-500 bg-red-50'
            else btnClass = 'border-gray-100 bg-gray-50 opacity-60'
          }
          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={selectedAnswer !== null}
              className={`p-5 rounded-xl border-2 text-left transition-all ${btnClass}`}
            >
              <span className="text-base text-gray-800 font-medium">{option}</span>
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {selectedAnswer !== null && (
        <div className={`mt-6 p-4 rounded-xl text-center font-bold ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isCorrect
            ? `🎉 Correct! -${damagePerHit} HP to boss!`
            : `❌ Wrong! Panda takes ${damageTaken} damage!`
          }
          {!isCorrect && (
            <div className="text-sm font-normal mt-1 text-gray-600">Correct: {question.meaning}</div>
          )}
        </div>
      )}
    </div>
  )
}
