'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCoins } from '@/lib/use-coins'

const REVIVE_COST = 50

interface MazeCell {
  row: number
  col: number
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean }
  hasChar: boolean
  char: string
  isTrap: boolean
  isExit: boolean
  trapRevealed: boolean
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
  rewards: { coins: { min: number; max: number }; exp: number }
}

export default function AdventureGameMaze({ level }: { level: AdventureLevel }) {
  const router = useRouter()
  const { balance, refresh } = useCoins()
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'completed' | 'failed'>('ready')
  const [maze, setMaze] = useState<MazeCell[][]>([])
  const [playerPos, setPlayerPos] = useState({ row: 0, col: 0 })
  const [collected, setCollected] = useState<string[]>([])
  const [bossHp, setBossHp] = useState(3)
  const [maxBossHp, setMaxBossHp] = useState(3)
  const [playerHp, setPlayerHp] = useState(3)
  const [maxPlayerHp, setMaxPlayerHp] = useState(3)
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [playerStats, setPlayerStats] = useState({ power: 0, defense: 0, luck: 0 })
  const [wordPool, setWordPool] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rewards, setRewards] = useState<{ coins: number; exp: number } | null>(null)
  const [levelUp, setLevelUp] = useState(false)
  const [doubleXp, setDoubleXp] = useState(false)
  const [droppedItem, setDroppedItem] = useState<{ name: string; emoji: string } | null>(null)
  const [message, setMessage] = useState('')
  const damagePerHit = Math.max(1, 1 + Math.floor(playerStats.power / 15))
  const trapDamage = Math.max(1, 3 - Math.floor(playerStats.defense / 10))
  const mazeSize = Math.min(9, Math.max(5, 3 + level.difficulty * 2))
  const charsToCollect = Math.min(5, 2 + level.difficulty)
  const totalTraps = level.difficulty * 2
  const baseTime = Math.max(20, 45 - level.difficulty * 5)
  const [totalCharsInMaze, setTotalCharsInMaze] = useState(charsToCollect)
  const [authState, setAuthState] = useState<'loading' | 'anon' | 'authenticated'>('loading')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setAuthState(d.user ? 'authenticated' : 'anon'))
      .catch(() => setAuthState('anon'))
  }, [])

  // Initialize
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
        setWordPool(list.map((w: { word: string }) => w.word))
      } else {
        setWordPool([
          '你好', '学习', '朋友', '快乐', '熊猫',
          '老师', '吃饭', '喝水', '看书', '中国',
          '再见', '谢谢', '对不起', '大', '小',
          '猫', '狗', '花', '山', '水',
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

  // Generate maze and place contents
  const buildMaze = useCallback((pool: string[]) => {
    const grid = generateMazeGrid(mazeSize, mazeSize)

    const available: { row: number; col: number }[] = []
    for (let r = 0; r < mazeSize; r++) {
      for (let c = 0; c < mazeSize; c++) {
        if ((r === 0 && c === 0) || grid[r][c].isExit) continue
        available.push({ row: r, col: c })
      }
    }
    const shuffledCells = [...available].sort(() => Math.random() - 0.5)

    const poolCopy = [...pool].sort(() => Math.random() - 0.5)
    let cellIdx = 0

    for (let i = 0; i < charsToCollect && i < poolCopy.length && cellIdx < shuffledCells.length; i++) {
      const cell = shuffledCells[cellIdx++]
      grid[cell.row][cell.col].hasChar = true
      grid[cell.row][cell.col].char = poolCopy[i]
    }

    // If not enough chars in pool, reduce required count
    const actualChars = Math.min(charsToCollect, poolCopy.length)

    for (let i = 0; i < totalTraps && cellIdx < shuffledCells.length; i++) {
      const cell = shuffledCells[cellIdx++]
      if (!grid[cell.row][cell.col].hasChar) {
        grid[cell.row][cell.col].isTrap = true
      }
    }

    const placedCount = Math.min(charsToCollect, poolCopy.length, shuffledCells.length)
    setMaze(grid)
    setPlayerPos({ row: 0, col: 0 })
    setCollected([])
    setTotalCharsInMaze(placedCount)
    setMessage('')
    return placedCount
  }, [mazeSize, charsToCollect, totalTraps])

  useEffect(() => {
    if (wordPool.length > 0 && gameState === 'ready') {
      buildMaze(wordPool)
    }
  }, [wordPool, gameState, buildMaze])

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setGameState('failed')
          fetch('/api/adventure/levels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ levelId: level.id, action: 'level_failure' }),
          }).catch(() => {})
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [gameState, level.id])

  // Reveal traps adjacent to a position
  const revealAdjacent = useCallback((grid: MazeCell[][], row: number, col: number) => {
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]
    const newGrid = grid.map(r => r.map(c => ({ ...c })))
    let changed = false

    for (const [dr, dc] of dirs) {
      const nr = row + dr
      const nc = col + dc
      if (nr >= 0 && nr < mazeSize && nc >= 0 && nc < mazeSize && newGrid[nr][nc].isTrap && !newGrid[nr][nc].trapRevealed) {
        newGrid[nr][nc].trapRevealed = true
        changed = true
      }
    }

    if (changed) setMaze(newGrid)
  }, [mazeSize])

  const movePlayer = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameState !== 'playing') return

    const { row, col } = playerPos
    const cell = maze[row]?.[col]
    if (!cell) return

    if ((direction === 'up' && cell.walls.top) ||
        (direction === 'down' && cell.walls.bottom) ||
        (direction === 'left' && cell.walls.left) ||
        (direction === 'right' && cell.walls.right)) {
      return
    }

    let newRow = row
    let newCol = col
    switch (direction) {
      case 'up': newRow--; break
      case 'down': newRow++; break
      case 'left': newCol--; break
      case 'right': newCol++; break
    }

    if (newRow < 0 || newRow >= mazeSize || newCol < 0 || newCol >= mazeSize) return

    setPlayerPos({ row: newRow, col: newCol })
    const newCell = maze[newRow][newCol]

    // Reveal traps around new position
    revealAdjacent(maze, newRow, newCol)

    // Check for character collection
    if (newCell.hasChar && !collected.includes(newCell.char)) {
      const newCollected = [...collected, newCell.char]
      setCollected(newCollected)
      setCorrectCount(prev => prev + 1)
      setScore(prev => prev + 10 + Math.floor(playerStats.luck / 3))

      const newBossHp = Math.max(0, bossHp - damagePerHit)
      setBossHp(newBossHp)
      setMessage(`Found "${newCell.char}"! -${damagePerHit} HP to boss!`)
      const nextCorrect = correctCount + 1

      if (newBossHp <= 0) {
        setTimeout(() => completeLevel(nextCorrect), 600)
      } else if (newCollected.length >= totalCharsInMaze) {
        setTimeout(() => completeLevel(nextCorrect), 600)
      }
    }

    // Check for trap
    if (newCell.isTrap && !newCell.trapRevealed) {
      // Reveal the trap
      const newMaze = maze.map(r => r.map(c => ({ ...c })))
      newMaze[newRow][newCol].trapRevealed = true
      setMaze(newMaze)

      const newPlayerHp = Math.max(0, playerHp - trapDamage)
      setPlayerHp(newPlayerHp)
      setMessage(`💀 Trap! -${trapDamage} HP!`)

      if (newPlayerHp <= 0) {
        setTimeout(() => {
          setGameState('failed')
          fetch('/api/adventure/levels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ levelId: level.id, action: 'level_failure' }),
          }).catch(() => {})
        }, 500)
      }
    }

    // Check exit
    if (newCell.isExit && collected.length >= totalCharsInMaze) {
      setTimeout(() => completeLevel(), 600)
    } else if (newCell.isExit) {
      setMessage(`Collect ${totalCharsInMaze - collected.length} more character(s) first!`)
    }
  }, [gameState, playerPos, maze, mazeSize, collected, bossHp, playerHp, damagePerHit, trapDamage, charsToCollect, level.id, playerStats.luck, revealAdjacent, totalCharsInMaze])

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); movePlayer('up'); break
        case 'ArrowDown': e.preventDefault(); movePlayer('down'); break
        case 'ArrowLeft': e.preventDefault(); movePlayer('left'); break
        case 'ArrowRight': e.preventDefault(); movePlayer('right'); break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [movePlayer])

  const completeLevel = async (collectedCount?: number) => {
    setGameState('completed')
    const actualCorrect = collectedCount ?? correctCount

    const res = await fetch('/api/adventure/levels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelId: level.id, action: 'complete',
        score: actualCorrect, correctCount: actualCorrect, totalCount: totalCharsInMaze,
      }),
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
        body: JSON.stringify({ levelId: level.id, action: 'start' }),
      })
      const data = await res.json()
      if (data.success) {
        setTimeLeft(baseTime)
        setGameState('playing')
        setBossHp(maxBossHp)
        setPlayerHp(maxPlayerHp)
        setScore(0)
        setCorrectCount(0)
        setCollected([])
        // Build maze
        const pool = wordPool.length > 0 ? wordPool : ['你好', '学习', '朋友', '快乐', '熊猫']
        buildMaze(pool)
        setPlayerPos({ row: 0, col: 0 })
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
    setCorrectCount(0)
    setScore(0)
    setCollected([])
    setMessage('')
    setGameState('ready')
    setRewards(null)
    setLevelUp(false)
    setDoubleXp(false)
    setDroppedItem(null)
    setTotalCharsInMaze(charsToCollect)
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
      setTimeLeft(baseTime)
      setCollected([])
      setScore(0)
      setCorrectCount(0)
      setMessage('')
      setGameState('playing')
      // Rebuild maze
      const pool = wordPool.length > 0 ? wordPool : ['你好', '学习', '朋友', '快乐', '熊猫']
      buildMaze(pool)
      setPlayerPos({ row: 0, col: 0 })
    }
  }

  // --- Render ---

  if (loading || authState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐼</div>
          <p className="text-gray-500">Preparing maze...</p>
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
            <div><div className="text-purple-500 text-xl">🧩</div><div className="text-sm text-gray-600">{mazeSize}x{mazeSize} maze</div></div>
            <div><div className="text-amber-600 text-xl">💰</div><div className="text-sm text-gray-600">{level.rewards.coins.min}-{level.rewards.coins.max} coins</div></div>
          </div>
        </div>
        <div className="flex justify-center gap-6 mb-6 text-sm">
          <span>⚔️ Power {playerStats.power} (DMG {damagePerHit})</span>
          <span>🛡️ Defense {playerStats.defense} (Trap dmg {trapDamage})</span>
          <span>🍀 Luck {playerStats.luck}</span>
        </div>

        <details className="mb-6 text-left bg-blue-50 rounded-xl p-4">
          <summary className="text-sm font-medium text-blue-700 cursor-pointer">📖 How to play</summary>
          <div className="mt-3 text-sm text-gray-600 space-y-2">
            <p>🧭 Use <strong>arrow keys</strong> or <strong>on-screen buttons</strong> to navigate the {mazeSize}x{mazeSize} maze</p>
            <p>🎯 Collect <strong>{charsToCollect}</strong> Chinese characters to defeat the boss</p>
            <p>💀 Watch out for <strong>hidden traps</strong> — they deal {trapDamage} DMG</p>
            <p>🛡️ Cells next to you reveal their traps</p>
            <p>⏱️ Complete before time runs out!</p>
            <p>🚪 Reach the exit after collecting all characters</p>
          </div>
        </details>

        <button onClick={handleStart} disabled={starting}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg hover:from-emerald-600 hover:to-green-700 shadow-lg disabled:from-gray-300 disabled:to-gray-300 transition-all"
        >
          {starting ? 'Starting...' : '🧭 Enter Maze!'}
        </button>
      </div>
    )
  }

  // Completion screen
  if (gameState === 'completed' && rewards) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-8xl mb-6 animate-bounce">🎉</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Maze Complete!</h1>
        <p className="text-xl text-gray-600 mb-2">{level.name} cleared!</p>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div><div className="text-3xl font-bold text-amber-600">💰 {rewards.coins}</div><div className="text-sm text-gray-500">Coins earned</div></div>
            <div><div className="text-3xl font-bold text-purple-600">✨ {rewards.exp}</div><div className="text-sm text-gray-500">XP gained</div></div>
            <div><div className="text-3xl font-bold text-green-600">{correctCount}</div><div className="text-sm text-gray-500">Characters collected</div></div>
            <div><div className="text-3xl font-bold text-blue-600">{score}</div><div className="text-sm text-gray-500">Score</div></div>
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Maze Failed</h1>
        <p className="text-gray-600 mb-6">You got lost in the maze! Try again!</p>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div><div className="text-3xl font-bold text-green-600">{correctCount}</div><div className="text-sm text-gray-500">Collected</div></div>
            <div><div className="text-3xl font-bold text-blue-600">{score}</div><div className="text-sm text-gray-500">Score</div></div>
          </div>
          {/* Revive button */}
          <button
            onClick={handleRevive}
            disabled={balance < REVIVE_COST}
            className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-300 transition-all shadow-lg"
          >
            {balance >= REVIVE_COST
              ? `💀 Revive (${REVIVE_COST} coins) - Continue exploring!`
              : `Not enough coins for revive (need ${REVIVE_COST})`
            }
          </button>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={retry} className="px-6 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600">🔄 Try Again</button>
          <button onClick={() => router.push('/adventure')} className="px-6 py-2 rounded-xl bg-gray-500 text-white hover:bg-gray-600">Back to Map</button>
        </div>
      </div>
    )
  }

  // Playing
  const cellSizePx = Math.max(40, Math.min(64, Math.floor(300 / mazeSize)))

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
            <span className="text-gray-500">{mazeSize}x{mazeSize}</span>
            <span className="text-purple-600 font-medium">{totalCharsInMaze - collected.length} left</span>
          </div>
        </div>

        {/* Boss HP */}
        <div className="mb-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-red-500 font-medium">💀 Boss</span>
            <span className="text-gray-600">{bossHp}/{maxBossHp}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-500"
              style={{ width: `${(bossHp / maxBossHp) * 100}%` }} />
          </div>
        </div>

        {/* Player HP */}
        <div className="mb-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-blue-500 font-medium">🐼 Panda</span>
            <span className="text-gray-600">{playerHp}/{maxPlayerHp}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
              style={{ width: `${(playerHp / maxPlayerHp) * 100}%` }} />
          </div>
        </div>

        {/* Timer + Status */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">⏱️</span>
            <span className={`font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Maze Grid */}
      <div className="flex justify-center mb-4">
        <div
          className="grid gap-0 bg-white border-2 border-gray-400 rounded-lg overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${mazeSize}, ${cellSizePx}px)`,
            gridTemplateRows: `repeat(${mazeSize}, ${cellSizePx}px)`,
          }}
        >
          {maze.map((row, r) =>
            row.map((cell, c) => {
              const isPlayer = r === playerPos.row && c === playerPos.col
              const isCollected = cell.hasChar && collected.includes(cell.char)

              let cellContent = ''
              let cellBg = 'bg-white'
              let extraCls = ''

              if (isPlayer) {
                cellContent = '🐼'
              } else if (cell.hasChar && isCollected) {
                cellContent = '✓'
                cellBg = 'bg-green-50'
              } else if (cell.hasChar && !isCollected) {
                cellContent = cell.char
                cellBg = 'bg-amber-50'
              } else if (cell.isTrap && cell.trapRevealed) {
                cellContent = '💀'
                cellBg = 'bg-red-50'
              } else if (cell.isExit) {
                cellContent = '🚪'
                cellBg = 'bg-emerald-50'
              }

              return (
                <div
                  key={`${r}-${c}`}
                  className={`
                    flex items-center justify-center text-sm font-bold
                    ${cellBg} ${extraCls}
                    transition-colors duration-200
                  `}
                  style={{
                    borderTop: cell.walls.top ? '2px solid #666' : '1px solid #e5e7eb',
                    borderLeft: cell.walls.left ? '2px solid #666' : '1px solid #e5e7eb',
                    borderRight: cell.walls.right ? '2px solid #666' : '1px solid #e5e7eb',
                    borderBottom: cell.walls.bottom ? '2px solid #666' : '1px solid #e5e7eb',
                    fontSize: isPlayer ? '20px' : cell.hasChar && !isCollected ? '16px' : '14px',
                  }}
                >
                  {cellContent}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-xl text-center font-bold text-sm mb-3 ${
          message.includes('Found') ? 'bg-green-100 text-green-700' :
          message.includes('Trap') ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {message}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => movePlayer('up')}
          className="w-14 h-14 rounded-xl bg-gray-100 hover:bg-gray-200 text-2xl flex items-center justify-center active:scale-95 transition-all shadow-sm border border-gray-200"
        >
          ▲
        </button>
        <div className="flex gap-1">
          <button
            onClick={() => movePlayer('left')}
            className="w-14 h-14 rounded-xl bg-gray-100 hover:bg-gray-200 text-2xl flex items-center justify-center active:scale-95 transition-all shadow-sm border border-gray-200"
          >
            ◀
          </button>
          <button
            onClick={() => movePlayer('down')}
            className="w-14 h-14 rounded-xl bg-gray-100 hover:bg-gray-200 text-2xl flex items-center justify-center active:scale-95 transition-all shadow-sm border border-gray-200"
          >
            ▼
          </button>
          <button
            onClick={() => movePlayer('right')}
            className="w-14 h-14 rounded-xl bg-gray-100 hover:bg-gray-200 text-2xl flex items-center justify-center active:scale-95 transition-all shadow-sm border border-gray-200"
          >
            ▶
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Arrow keys to move</p>
      </div>
    </div>
  )
}

// --- Maze generation ---

function generateMazeGrid(rows: number, cols: number): MazeCell[][] {
  const grid: MazeCell[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      row: r,
      col: c,
      walls: { top: true, right: true, bottom: true, left: true },
      hasChar: false,
      char: '',
      isTrap: false,
      isExit: r === rows - 1 && c === cols - 1,
      trapRevealed: false,
    }))
  )

  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false))
  const stack: { row: number; col: number }[] = []
  visited[0][0] = true
  stack.push({ row: 0, col: 0 })

  while (stack.length > 0) {
    const cur = stack[stack.length - 1]
    const neighbors: { row: number; col: number; dir: string }[] = []

    if (cur.row > 0 && !visited[cur.row - 1][cur.col])
      neighbors.push({ row: cur.row - 1, col: cur.col, dir: 'top' })
    if (cur.row < rows - 1 && !visited[cur.row + 1][cur.col])
      neighbors.push({ row: cur.row + 1, col: cur.col, dir: 'bottom' })
    if (cur.col > 0 && !visited[cur.row][cur.col - 1])
      neighbors.push({ row: cur.row, col: cur.col - 1, dir: 'left' })
    if (cur.col < cols - 1 && !visited[cur.row][cur.col + 1])
      neighbors.push({ row: cur.row, col: cur.col + 1, dir: 'right' })

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)]
      switch (next.dir) {
        case 'top':
          grid[cur.row][cur.col].walls.top = false
          grid[next.row][next.col].walls.bottom = false
          break
        case 'bottom':
          grid[cur.row][cur.col].walls.bottom = false
          grid[next.row][next.col].walls.top = false
          break
        case 'left':
          grid[cur.row][cur.col].walls.left = false
          grid[next.row][next.col].walls.right = false
          break
        case 'right':
          grid[cur.row][cur.col].walls.right = false
          grid[next.row][next.col].walls.left = false
          break
      }
      visited[next.row][next.col] = true
      stack.push({ row: next.row, col: next.col })
    } else {
      stack.pop()
    }
  }

  return grid
}
