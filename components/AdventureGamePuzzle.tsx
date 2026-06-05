'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCoins } from '@/lib/use-coins'

const REVIVE_COST = 50

interface PuzzleCell {
  char: string
  word: string
  id: number
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

interface AdventureGamePuzzleProps {
  level: AdventureLevel
}

export default function AdventureGamePuzzle({ level }: AdventureGamePuzzleProps) {
  const router = useRouter()
  const { balance, refresh } = useCoins()
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'completed' | 'failed'>('ready')
  const [grid, setGrid] = useState<PuzzleCell[]>([])
  const [targetWord, setTargetWord] = useState('')
  const [targetPinyin, setTargetPinyin] = useState('')
  const [targetMeaning, setTargetMeaning] = useState('')
  const [bossHp, setBossHp] = useState(3)
  const [maxBossHp, setMaxBossHp] = useState(3)
  const [playerHp, setPlayerHp] = useState(3)
  const [maxPlayerHp, setMaxPlayerHp] = useState(3)
  const [timeLeft, setTimeLeft] = useState(15)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedCell, setSelectedCell] = useState<number | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [hintsLeft, setHintsLeft] = useState(0)
  const [hintCell, setHintCell] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [rewards, setRewards] = useState<{ coins: number; exp: number } | null>(null)
  const [levelUp, setLevelUp] = useState(false)
  const [doubleXp, setDoubleXp] = useState(false)
  const [droppedItem, setDroppedItem] = useState<{ name: string; emoji: string } | null>(null)
  const [playerStats, setPlayerStats] = useState({ power: 0, defense: 0, luck: 0 })
  const [wordPool, setWordPool] = useState<{ word: string; pinyin: string; meaning: string }[]>([])
  const [totalRounds, setTotalRounds] = useState(0)
  const [round, setRound] = useState(0)
  const [authState, setAuthState] = useState<'loading' | 'anon' | 'authenticated'>('loading')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setAuthState(d.user ? 'authenticated' : 'anon'))
      .catch(() => setAuthState('anon'))
  }, [])

  const damagePerHit = Math.max(1, 1 + Math.floor(playerStats.power / 15))
  const damageTaken = Math.max(1, 2 - Math.floor(playerStats.defense / 10))
  const luckBonus = Math.floor(playerStats.luck / 3)
  const baseTime = Math.max(8, 18 - level.difficulty * 2)

  useEffect(() => {
    const initialize = async () => {
      try {
        const equipRes = await fetch('/api/adventure/equipment')
        const equipData = await equipRes.json()
        if (equipData.stats) setPlayerStats(equipData.stats)
      } catch {}

      const stored = localStorage.getItem('chineselearn-words')
      const list = stored ? JSON.parse(stored) : []
      if (list.length >= 4) {
        setWordPool(list)
      } else {
        // Fallback words
        setWordPool([
          { word: '你好', pinyin: 'nǐ hǎo', meaning: 'Hello' },
          { word: '学习', pinyin: 'xué xí', meaning: 'Study' },
          { word: '朋友', pinyin: 'péng yǒu', meaning: 'Friend' },
          { word: '快乐', pinyin: 'kuài lè', meaning: 'Happy' },
          { word: '熊猫', pinyin: 'xióng māo', meaning: 'Panda' },
          { word: '老师', pinyin: 'lǎo shī', meaning: 'Teacher' },
          { word: '吃饭', pinyin: 'chī fàn', meaning: 'Eat' },
          { word: '喝水', pinyin: 'hē shuǐ', meaning: 'Drink water' },
          { word: '看书', pinyin: 'kàn shū', meaning: 'Read' },
          { word: '写字', pinyin: 'xiě zì', meaning: 'Write' },
          { word: '中国', pinyin: 'zhōng guó', meaning: 'China' },
          { word: '再见', pinyin: 'zài jiàn', meaning: 'Goodbye' },
          { word: '谢谢', pinyin: 'xiè xiè', meaning: 'Thank you' },
          { word: '对不起', pinyin: 'duì bu qǐ', meaning: 'Sorry' },
          { word: '没关系', pinyin: 'méi guān xì', meaning: 'No problem' },
          { word: '大', pinyin: 'dà', meaning: 'Big' },
          { word: '小', pinyin: 'xiǎo', meaning: 'Small' },
        ])
      }

      const baseHp = 3 + level.difficulty
      setBossHp(baseHp)
      setMaxBossHp(baseHp)
      setPlayerHp(3)
      setMaxPlayerHp(3)
      setLoading(false)
    }
    initialize()
  }, [level])

  const generatePuzzle = useCallback((pool: { word: string; pinyin: string; meaning: string }[]) => {
    if (pool.length < 2) return

    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const target = shuffled[0]
    const others = shuffled.slice(1, 16)

    const cells: PuzzleCell[] = [
      { char: target.word, word: target.word, id: 0 },
      ...others.map((w, i) => ({ char: w.word, word: w.word, id: i + 1 })),
    ].sort(() => Math.random() - 0.5)

    setGrid(cells)
    setTargetWord(target.word)
    setTargetPinyin(target.pinyin)
    setTargetMeaning(target.meaning)
    setSelectedCell(null)
    setResult(null)
    setHintCell(null)

    // Luck-based hints
    const hints = Math.floor(playerStats.luck / 8)
    setHintsLeft(hints)
  }, [playerStats.luck])

  useEffect(() => {
    if (wordPool.length > 0 && gameState === 'ready') {
      generatePuzzle(wordPool)
    }
  }, [wordPool, gameState, generatePuzzle])

  // Timer
  useEffect(() => {
    if (gameState !== 'playing' || selectedCell !== null) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [gameState, selectedCell, round])

  const handleTimeUp = () => {
    // Time's up - player takes damage
    setTotalRounds(prev => prev + 1)
    const newPlayerHp = Math.max(0, playerHp - damageTaken)
    setPlayerHp(newPlayerHp)
    setCombo(0)
    setResult('wrong')

    setTimeout(() => {
      if (newPlayerHp <= 0) {
        setGameState('failed')
        fetch('/api/adventure/levels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ levelId: level.id, action: 'level_failure' })
        }).catch(() => {})
        return
      }
      nextRound()
    }, 1000)
  }

  const handleCellClick = (id: number) => {
    if (selectedCell !== null || gameState !== 'playing') return
    setSelectedCell(id)
    setTotalRounds(prev => prev + 1)

    const cell = grid[id]
    const correct = cell.word === targetWord
    setResult(correct ? 'correct' : 'wrong')

    if (correct) {
      const newCombo = combo + 1
      setCombo(newCombo)
      if (newCombo > maxCombo) setMaxCombo(newCombo)
      setCorrectCount(prev => prev + 1)
      setBossHp(prev => Math.max(0, prev - damagePerHit))
    } else {
      setCombo(0)
      // Player takes damage on wrong pick
      const newPlayerHp = Math.max(0, playerHp - damageTaken)
      setPlayerHp(newPlayerHp)
    }

    setTimeout(() => {
      const newBossHp = correct ? Math.max(0, bossHp - damagePerHit) : bossHp

      if (correct && newBossHp <= 0) {
        completeLevel(correctCount + 1, totalRounds + 1)
      } else {
        nextRound()
      }
    }, 800)
  }

  const nextRound = () => {
    if (wordPool.length < 2) {
      setGameState('failed')
      return
    }
    setRound(prev => prev + 1)
    setTimeLeft(baseTime)
    generatePuzzle(wordPool)
  }

  const useHint = () => {
    if (hintsLeft <= 0) return
    const correctIdx = grid.findIndex(c => c.word === targetWord)
    if (correctIdx >= 0) {
      setHintCell(correctIdx)
      setHintsLeft(prev => prev - 1)
      setTimeout(() => setHintCell(null), 1500)
    }
  }

  const completeLevel = async (finalCorrect: number, finalTotal: number) => {
    setGameState('completed')

    const res = await fetch('/api/adventure/levels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelId: level.id, action: 'complete',
        score: finalCorrect, correctCount: finalCorrect, totalCount: finalTotal
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
        setTimeLeft(baseTime)
        setGameState('playing')
        setBossHp(maxBossHp)
        setPlayerHp(maxPlayerHp)
      } else {
        setError(data.error || 'Not enough energy!')
      }
    } catch {
      setError('Failed to start level')
    }
    setStarting(false)
  }

  const retry = () => {
    setBossHp(maxBossHp)
    setPlayerHp(maxPlayerHp)
    setCombo(0)
    setMaxCombo(0)
    setCorrectCount(0)
    setScore(0)
    setRound(0)
    setSelectedCell(null)
    setResult(null)
    setHintCell(null)
    setTotalRounds(0)
    setGameState('ready')
    setRewards(null)
    setLevelUp(false)
    setDoubleXp(false)
    setDroppedItem(null)
    setError(null)
  }

  const handleRevive = async () => {
    const res = await fetch('/api/adventure/levels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ levelId: level.id, action: 'revive' })
    })
    const data = await res.json()
    if (data.success) {
      setBossHp(Math.max(1, Math.floor(maxBossHp / 2)))
      setPlayerHp(maxPlayerHp)
      setCombo(0)
      setResult(null)
      setSelectedCell(null)
      setTotalRounds(0)
      setGameState('playing')
      setTimeLeft(baseTime)
      setRound(0)
    }
  }

  if (loading || authState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐼</div>
          <p className="text-gray-500">Preparing puzzle...</p>
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
          <Link href="/register" className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg">🚀 Sign Up</Link>
          <Link href="/login" className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all text-sm">Log In</Link>
          <Link href="/adventure" className="text-sm text-gray-400 hover:text-gray-600">← Back to map</Link>
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
            <div><div className="text-amber-500 text-xl">⚡</div><div className="text-sm text-gray-600">-{level.requiredEnergy} energy</div></div>
            <div><div className="text-red-500 text-xl">💀</div><div className="text-sm text-gray-600">Boss HP: {maxBossHp}</div></div>
            <div><div className="text-red-500 text-xl">🔍</div><div className="text-sm text-gray-600">Find the word!</div></div>
            <div><div className="text-amber-600 text-xl">💰</div><div className="text-sm text-gray-600">{level.rewards.coins.min}-{level.rewards.coins.max} coins</div></div>
          </div>
        </div>
        <div className="flex justify-center gap-6 mb-6 text-sm">
          <span>⚔️ Power {playerStats.power} (DMG {damagePerHit})</span>
          <span>🛡️ Defense {playerStats.defense} (DMG taken {damageTaken})</span>
          <span>🍀 Luck {playerStats.luck}</span>
        </div>

        <details className="mb-6 text-left bg-blue-50 rounded-xl p-4">
          <summary className="text-sm font-medium text-blue-700 cursor-pointer">📖 How to play</summary>
          <div className="mt-3 text-sm text-gray-600 space-y-2">
            <p>🔍 <strong>Find</strong> the matching Chinese character in the grid</p>
            <p>⏱️ Each round has a {baseTime}-second time limit</p>
            <p>⚔️ Finding the correct word deals <strong>{damagePerHit} DMG</strong> to the boss</p>
            <p>🛡️ Wrong pick or timeout: panda takes <strong>{damageTaken} DMG</strong></p>
            {hintsLeft > 0 && <p>💡 Luck gives you <strong>{hintsLeft}</strong> hint(s) per round</p>}
            <p>🎯 Defeat the boss to clear the level!</p>
          </div>
        </details>

        <button onClick={handleStart} disabled={starting}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg hover:from-emerald-600 hover:to-green-700 shadow-lg disabled:from-gray-300 disabled:to-gray-300 transition-all"
        >
          {starting ? 'Starting...' : '🔍 Start Puzzle!'}
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
            <div><div className="text-3xl font-bold text-amber-600">💰 {rewards.coins}</div><div className="text-sm text-gray-500">Coins earned</div></div>
            <div><div className="text-3xl font-bold text-purple-600">✨ {rewards.exp}</div><div className="text-sm text-gray-500">XP gained</div></div>
            <div><div className="text-3xl font-bold text-green-600">{correctCount}</div><div className="text-sm text-gray-500">Found</div></div>
            <div><div className="text-3xl font-bold text-orange-600">{maxCombo}x</div><div className="text-sm text-gray-500">Best combo</div></div>
          </div>
          {doubleXp && (
            <div className="mt-3 p-2 bg-yellow-100 rounded-xl text-yellow-700 font-bold text-sm">✨ DOUBLE XP - First daily level!</div>
          )}
          {droppedItem && (
            <div className="mt-2 p-2 bg-green-100 rounded-xl text-green-700 font-medium text-sm">
              🎁 Item dropped: {droppedItem.emoji} {droppedItem.name}!
            </div>
          )}
          {levelUp && <div className="mt-3 p-3 bg-purple-100 rounded-xl text-purple-700 font-bold">🎊 Level Up!</div>}
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
            <div><div className="text-3xl font-bold text-green-600">{correctCount}</div><div className="text-sm text-gray-500">Found</div></div>
            <div><div className="text-3xl font-bold text-orange-600">{maxCombo}x</div><div className="text-sm text-gray-500">Best combo</div></div>
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
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* HUD */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{level.emoji}</span>
            <span className="font-bold text-gray-800">{level.name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-red-500">⚔️ {damagePerHit}</span>
            <span className="text-gray-500">Round {round + 1}</span>
          </div>
        </div>

        {/* Boss HP */}
        <div className="mb-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-red-500 font-medium">💀 Boss</span>
            <span className="text-gray-600">{bossHp}/{maxBossHp}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-500" style={{ width: `${(bossHp / maxBossHp) * 100}%` }} />
          </div>
        </div>

        {/* Player HP */}
        <div className="mb-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-blue-500 font-medium">🐼 Panda</span>
            <span className="text-gray-600">{playerHp}/{maxPlayerHp}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500" style={{ width: `${(playerHp / maxPlayerHp) * 100}%` }} />
          </div>
        </div>

        {/* Timer + Combo */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">⏱️</span>
            <span className={`font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>{timeLeft}s</span>
          </div>
          {combo > 1 && <span className="text-orange-500 font-bold text-sm animate-pulse">🔥 {combo}x Combo!</span>}
          {hintsLeft > 0 && (
            <button onClick={useHint} className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200">
              💡 Hint ({hintsLeft})
            </button>
          )}
        </div>
      </div>

      {/* Target: show English meaning, hide Chinese word */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4 text-center">
        <p className="text-xs text-gray-500 mb-1">Find the Chinese word for:</p>
        <div className="text-3xl font-bold text-blue-600 mb-1">{targetMeaning}</div>
        <p className="text-sm text-gray-400">pinyin: {targetPinyin}</p>
        <div className="mt-2 text-lg text-gray-300">? ? ?</div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {grid.map((cell, idx) => {
          let cls = 'aspect-square rounded-xl border-2 text-2xl font-bold flex items-center justify-center transition-all cursor-pointer '
          if (selectedCell !== null && idx === selectedCell && result === 'correct') {
            cls += 'border-green-500 bg-green-100 text-green-700 scale-95'
          } else if (selectedCell !== null && idx === selectedCell && result === 'wrong') {
            cls += 'border-red-500 bg-red-100 text-red-700 scale-95'
          } else if (hintCell === idx) {
            cls += 'border-yellow-400 bg-yellow-50 text-yellow-700 animate-pulse'
          } else if (selectedCell !== null) {
            cls += 'border-gray-100 bg-gray-50 text-gray-300'
          } else {
            cls += 'border-gray-200 hover:border-amber-400 hover:bg-amber-50 bg-white text-gray-800'
          }
          return (
            <button key={idx} onClick={() => handleCellClick(idx)} disabled={selectedCell !== null} className={cls}>
              {cell.char}
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {result && (
        <div className={`p-3 rounded-xl text-center font-bold text-sm ${
          result === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {result === 'correct' ? `🎉 Found! -${damagePerHit} HP to boss!` : `⏰ Wrong! Panda takes ${damageTaken} damage!`}
        </div>
      )}
    </div>
  )
}
