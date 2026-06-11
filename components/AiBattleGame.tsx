'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { WORD_BOOKS } from '@/lib/wordbooks'
import { useTranslation } from '@/lib/i18n/context'
import type { Article } from '@/lib/types'
import { trackActivity } from '@/lib/activity'
import { useCoins } from '@/lib/use-coins'
import { spendCoins, addCoins, syncCoinsToApi } from '@/lib/pet'
import { AdInterstitial } from '@/lib/adsense'
import { useAuth } from '@/lib/auth-context'
import { hasSignupModalBeenShown, markSignupModalShown } from '@/lib/signup-guard'
import TrialBanner from './TrialBanner'
import SignupModal from './SignupModal'

type AiLevel = 'easy' | 'medium' | 'hard' | 'hell'

interface AiConfig {
  label: string
  labelZh: string
  accuracy: number
  minDelay: number
  maxDelay: number
  emoji: string
  entryFee: number      // 入场费（金币）
  winReward: number     // 胜利奖励（每正确一题）
  loseReward: number    // 失败奖励（每正确一题）
}

const AI_CONFIGS: Record<AiLevel, AiConfig> = {
  easy: {
    label: 'Easy',
    labelZh: '简单',
    accuracy: 0.6,
    minDelay: 3000,
    maxDelay: 6000,
    emoji: '🐣',
    entryFee: 0,
    winReward: 20,
    loseReward: 10,
  },
  medium: {
    label: 'Medium',
    labelZh: '中等',
    accuracy: 0.8,
    minDelay: 1500,
    maxDelay: 3000,
    emoji: '🤖',
    entryFee: 0,
    winReward: 30,
    loseReward: 15,
  },
  hard: {
    label: 'Hard',
    labelZh: '困难',
    accuracy: 0.95,
    minDelay: 800,
    maxDelay: 1500,
    emoji: '🧠',
    entryFee: 50,         // 困难模式需50金币
    winReward: 50,        // 每正确一题50金币，胜利额外奖励
    loseReward: 20,
  },
  hell: {
    label: 'Hell',
    labelZh: '地狱',
    accuracy: 0.99,
    minDelay: 500,
    maxDelay: 1000,
    emoji: '🔥',
    entryFee: 50,         // 地狱模式需50金币
    winReward: 80,        // 每正确一题80金币
    loseReward: 30,
  },
}

const ROUND_OPTIONS = [5, 10, 15, 20]

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getRandomWrongOption(options: string[], correct: string): string {
  const wrongs = options.filter((o) => o !== correct)
  return wrongs[Math.floor(Math.random() * wrongs.length)]
}

function formatTime(ms: number): string {
  return (ms / 1000).toFixed(1) + 's'
}

export default function AiBattleGame({ articles = [] }: { articles?: Article[] }) {
  const { locale } = useTranslation()
  const { user, loading } = useAuth()
  const { balance, refresh } = useCoins()
  const allWords = useMemo(() => WORD_BOOKS.flatMap((wb) => wb.words), [])

  const [sourceType, setSourceType] = useState<'wordbook' | 'article'>('wordbook')
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null)
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([])
  const [totalRounds, setTotalRounds] = useState(10)

  // Read articleIds from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ids = params.getAll('articleId')
    if (ids.length > 0) {
      const valid = ids.filter((id) => {
        const a = articles.find((art) => art.id === id)
        return a && a.vocabulary.length > 0
      })
      if (valid.length > 0) {
        setSelectedArticleIds(valid.slice(0, 3))
        setSourceType('article')
      }
    }
  }, [articles])

  const selectedArticles = useMemo(
    () => articles.filter((a) => selectedArticleIds.includes(a.id)),
    [articles, selectedArticleIds]
  )

  const sourceWords = useMemo(() => {
    if (sourceType === 'article' && selectedArticles.length > 0) {
      const seen = new Set<string>()
      const merged: typeof allWords = []
      for (const art of selectedArticles) {
        for (const w of art.vocabulary) {
          if (!seen.has(w.word)) {
            seen.add(w.word)
            merged.push(w)
          }
        }
      }
      return merged.length > 0 ? merged : allWords
    }
    if (selectedBookId === null) return allWords
    const book = WORD_BOOKS.find((b) => b.id === selectedBookId)
    return book ? book.words : allWords
  }, [allWords, selectedBookId, sourceType, selectedArticles])

  const [phase, setPhase] = useState<'select' | 'confirm' | 'playing' | 'result'>('select')
  const [aiLevel, setAiLevel] = useState<AiLevel>('medium')
  const [insufficientCoins, setInsufficientCoins] = useState(false)
  const [round, setRound] = useState(0)
  const [userScore, setUserScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const [userCorrect, setUserCorrect] = useState(0)
  const [aiCorrect, setAiCorrect] = useState(0)

  // Current round
  const [currentWord, setCurrentWord] = useState<(typeof allWords)[number] | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [aiPicked, setAiPicked] = useState<string | null>(null)
  const [userDone, setUserDone] = useState(false)
  const [aiDone, setAiDone] = useState(false)
  const [userTime, setUserTime] = useState(0)
  const [aiTime, setAiTime] = useState(0)
  const [bannerType, setBannerType] = useState<'register' | 'verify' | null>(null)
  const [signupShown, setSignupShown] = useState(false)
  const [signupBlocked, setSignupBlocked] = useState(false)

  // 登录检查
  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-8">Loading...</div>
  }

  if (signupBlocked) {
    return <SignupModal type="register" locale={locale} onClose={() => {}} />
  }

  const roundStartRef = useRef(0)
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null)
  const aiConfig = AI_CONFIGS[aiLevel]

  // Track used words to avoid repeats
  const usedWordIds = useRef(new Set<string>())

  const cleanup = useCallback(() => {
    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current)
      aiTimerRef.current = null
    }
  }, [])

  const startBattle = async () => {
    if (!user) {
      if (hasSignupModalBeenShown()) {
        setSignupBlocked(true)
      } else {
        setSignupShown(true)
      }
      return
    }
    if (!user.emailVerified) { setBannerType('verify'); return }
    const config = AI_CONFIGS[aiLevel]

    // 检查是否需要金币
    if (config.entryFee > 0) {
      if (balance < config.entryFee) {
        setInsufficientCoins(true)
        return
      }

      // 扣除入场费
      const success = await spendCoins(config.entryFee)
      if (!success) {
        setInsufficientCoins(true)
        return
      }
      await refresh()
    }

    // 开始对战
    setPhase('playing')
    setRound(0)
    setUserScore(0)
    setAiScore(0)
    setUserCorrect(0)
    setAiCorrect(0)
    usedWordIds.current.clear()
    pickWord()
  }

  useEffect(() => cleanup, [cleanup])

  const pickWord = useCallback(() => {
    const available = sourceWords.filter((w) => !usedWordIds.current.has(w.word))
    const pool = available.length > 0 ? available : sourceWords
    const sorted = shuffleArray(pool)
    const word = sorted[0]

    usedWordIds.current.add(word.word)

    const correct = word.meaning
    const wrongs = allWords
      .filter((w) => w.word !== word.word && w.meaning !== correct)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.meaning)

    const opts = shuffleArray([correct, ...wrongs])

    setCurrentWord(word)
    setOptions(opts)
    setSelectedAnswer(null)
    setAiPicked(null)
    setUserDone(false)
    setAiDone(false)
    setUserTime(0)
    setAiTime(0)
    roundStartRef.current = Date.now()
  }, [sourceWords, allWords])

  const startGame = () => {
    usedWordIds.current = new Set()
    setRound(0)
    setUserScore(0)
    setAiScore(0)
    setUserCorrect(0)
    setAiCorrect(0)
    setPhase('playing')
    // Small delay before first word appears
    setTimeout(() => pickWord(), 400)
  }

  const handleUserAnswer = (answer: string) => {
    if (userDone || !currentWord) return
    const elapsed = Date.now() - roundStartRef.current
    setUserTime(elapsed)
    setSelectedAnswer(answer)
    setUserDone(true)

    const isCorrect = answer === currentWord.meaning
    const timeBonus = Math.max(0, Math.round((8 - elapsed / 1000) * 3))
    const roundScore = isCorrect ? 100 + Math.min(timeBonus, 30) : 0
    setUserScore((prev) => prev + roundScore)
    if (isCorrect) setUserCorrect((prev) => prev + 1)

    // AI "thinks" then answers
    const aiDelay = aiConfig.minDelay + Math.random() * (aiConfig.maxDelay - aiConfig.minDelay)
    const aiCorrectFlag = Math.random() < aiConfig.accuracy
    const aiAns = aiCorrectFlag
      ? currentWord.meaning
      : getRandomWrongOption(options, currentWord.meaning)

    aiTimerRef.current = setTimeout(() => {
      const aiElapsed = aiDelay
      setAiTime(aiElapsed)
      setAiPicked(aiAns)
      setAiDone(true)

      const aiTimeBonus = Math.max(0, Math.round((8 - aiElapsed / 1000) * 3))
      const aiRoundScore = aiCorrectFlag ? 100 + Math.min(aiTimeBonus, 30) : 0
      setAiScore((prev) => prev + aiRoundScore)
      if (aiCorrectFlag) setAiCorrect((prev) => prev + 1)
    }, aiDelay)
  }

  const handleNext = () => {
    // 访客打 3 回合后弹出注册引导
    if (round === 2 && !user) {
      if (hasSignupModalBeenShown()) {
        setSignupBlocked(true)
      } else {
        setSignupShown(true)
      }
      return
    }
    const next = round + 1
    if (next >= totalRounds) {
      cleanup()
      // Calculate coin reward based on new config
      const config = AI_CONFIGS[aiLevel]
      const won = userScore > aiScore
      const draw = userScore === aiScore

      // 基础奖励：每正确一题 * 对应难度奖励
      let reward = userCorrect * (won ? config.winReward : config.loseReward)

      // 额外奖励
      if (won) {
        reward += Math.round(totalRounds * 5)  // 胜利额外奖励
      } else if (draw) {
        reward += Math.round(totalRounds * 2)  // 平局小奖励
      }

      // 扣除入场费（如果是收费模式）
      const netReward = reward - config.entryFee

      if (netReward > 0) {
        addCoins(netReward)
        syncCoinsToApi(netReward, 'battle_complete', `${aiLevel}, ${userCorrect}/${totalRounds} correct, ${won ? 'won' : draw ? 'draw' : 'lost'}, entry:${config.entryFee}, reward:${reward}`)
      }
      trackActivity('battle_complete', { userScore, aiScore, userCorrect, aiCorrect, aiLevel, totalRounds, entryFee: config.entryFee, reward })
      fetch('/api/adventure/energy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activity: 'battle_win' }) }).catch(() => {})
      setPhase('result')
      return
    }
    setRound(next)
    pickWord()
  }

  const handleSignupClose = () => {
    setSignupShown(false)
    markSignupModalShown()
    const next = round + 1
    setRound(next)
    pickWord()
  }

  // Format scores for display
  const maxScore = totalRounds * 130
  const userWon = userScore > aiScore
  const tie = userScore === aiScore

  if (phase === 'select') {
    return (
      <div className="bg-gradient-to-br from-orange-50 via-white to-amber-50 rounded-2xl border-2 border-orange-200 p-6 md:p-8">
        <div className="text-center mb-6">
          <p className="text-4xl mb-2">⚔️</p>
          <h2 className="text-xl font-bold text-gray-800">
            {locale === 'zh' ? 'AI 单词对战' : 'AI Word Battle'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {locale === 'zh'
              ? '选择对手难度，和 AI 比拼词汇！'
              : 'Choose AI difficulty and battle your vocabulary!'}
          </p>
        </div>
        {bannerType && (
          <TrialBanner type={bannerType} onClose={() => setBannerType(null)} />
        )}

        {/* AI Level selector */}
        <div className="grid grid-cols-2 gap-3 mb-6 max-w-md mx-auto">
          {(Object.entries(AI_CONFIGS) as [AiLevel, AiConfig][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setAiLevel(key)}
              className={`py-3 rounded-xl text-sm font-medium transition-all ${
                aiLevel === key
                  ? 'bg-orange-500 text-white shadow-sm ring-2 ring-orange-300'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-orange-50'
              }`}
            >
              <span className="block text-lg mb-0.5">{cfg.emoji}</span>
              <span>{locale === 'zh' ? cfg.labelZh : cfg.label}</span>
              {cfg.entryFee > 0 && (
                <span className={`block text-xs mt-1 ${aiLevel === key ? 'text-orange-200' : 'text-amber-500'}`}>
                  🪙 {cfg.entryFee}
                </span>
              )}
              {cfg.entryFee === 0 && (
                <span className={`block text-xs mt-1 ${aiLevel === key ? 'text-orange-200' : 'text-emerald-500'}`}>
                  {locale === 'zh' ? '免费' : 'Free'}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* AI stats */}
        <div className="bg-white rounded-xl p-4 mb-6 max-w-md mx-auto text-sm">
          {aiLevel === 'easy' && (
            <div className="text-gray-600">
              <p className="font-medium text-emerald-600 mb-1">
                {locale === 'zh' ? '🐣 简单模式（免费）' : '🐣 Easy (Free)'}
              </p>
              <p className="text-gray-500 text-xs">
                {locale === 'zh'
                  ? 'AI 正确率约 60%，答题慢（3-6秒），新手友好'
                  : 'AI ~60% accuracy, slow (3-6s), beginner friendly'}
              </p>
              <p className="text-amber-600 text-xs mt-2">
                {locale === 'zh' ? '💰 胜利：每题20金币' : '💰 Win: 20 coins/question'}
              </p>
            </div>
          )}
          {aiLevel === 'medium' && (
            <div className="text-gray-600">
              <p className="font-medium text-emerald-600 mb-1">
                {locale === 'zh' ? '🤖 中等模式（免费）' : '🤖 Medium (Free)'}
              </p>
              <p className="text-gray-500 text-xs">
                {locale === 'zh'
                  ? 'AI 正确率约 80%，答题适中（1.5-3秒），有点挑战'
                  : 'AI ~80% accuracy, moderate (1.5-3s), some challenge'}
              </p>
              <p className="text-amber-600 text-xs mt-2">
                {locale === 'zh' ? '💰 胜利：每题30金币' : '💰 Win: 30 coins/question'}
              </p>
            </div>
          )}
          {aiLevel === 'hard' && (
            <div className="text-gray-600">
              <p className="font-medium text-amber-600 mb-1">
                {locale === 'zh' ? '🧠 困难模式（50金币入场）' : '🧠 Hard (50 coins entry)'}
              </p>
              <p className="text-gray-500 text-xs">
                {locale === 'zh'
                  ? 'AI 正确率约 95%，答题快（0.8-1.5秒），高手对决'
                  : 'AI ~95% accuracy, fast (0.8-1.5s), expert challenge'}
              </p>
              <p className="text-amber-600 text-xs mt-2">
                {locale === 'zh' ? '💰 入场费50，胜利每题50金币' : '💰 Entry: 50, Win: 50 coins/question'}
              </p>
            </div>
          )}
          {aiLevel === 'hell' && (
            <div className="text-gray-600">
              <p className="font-medium text-red-600 mb-1">
                {locale === 'zh' ? '🔥 地狱模式（50金币入场）' : '🔥 Hell (50 coins entry)'}
              </p>
              <p className="text-gray-500 text-xs">
                {locale === 'zh'
                  ? 'AI 正确率约 99%，答题极快（0.5-1秒），极限挑战'
                  : 'AI ~99% accuracy, very fast (0.5-1s), extreme challenge'}
              </p>
              <p className="text-amber-600 text-xs mt-2">
                {locale === 'zh' ? '💰 入场费50，胜利每题80金币' : '💰 Entry: 50, Win: 80 coins/question'}
              </p>
            </div>
          )}
        </div>

        {/* Source type toggle */}
        <div className="mb-4 max-w-md mx-auto">
          <div className="flex gap-2 bg-white rounded-xl p-1 border border-gray-200">
            <button
              onClick={() => setSourceType('wordbook')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                sourceType === 'wordbook'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-orange-50'
              }`}
            >
              📚 {locale === 'zh' ? '按词库' : 'Word Book'}
            </button>
            <button
              onClick={() => setSourceType('article')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                sourceType === 'article'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-orange-50'
              }`}
            >
              📖 {locale === 'zh' ? '按文章' : 'Article'}
            </button>
          </div>
        </div>

        {/* Word book selection */}
        {sourceType === 'wordbook' && (
          <div className="mb-4 max-w-md mx-auto">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              📚 {locale === 'zh' ? '选择词库' : 'Vocabulary Book'}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedBookId(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedBookId === null
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-orange-50'
                }`}
              >
                📚 {locale === 'zh' ? '全部' : 'All'}
              </button>
              {WORD_BOOKS.map((book) => (
                <button
                  key={book.id}
                  onClick={() => setSelectedBookId(book.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedBookId === book.id
                      ? 'text-white shadow-sm'
                      : 'bg-white text-gray-500 border border-gray-200 hover:bg-orange-50'
                  }`}
                  style={selectedBookId === book.id ? { backgroundColor: book.color } : undefined}
                >
                  {book.emoji} {locale === 'zh' ? book.name : book.name}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {selectedBookId === null
                ? (locale === 'zh' ? `全部词库 · ${sourceWords.length} 个词` : `All books · ${sourceWords.length} words`)
                : `${WORD_BOOKS.find((b) => b.id === selectedBookId)?.emoji || ''} ${sourceWords.length} ${locale === 'zh' ? '个词' : 'words'}`}
            </p>
          </div>
        )}

        {/* Article selection */}
        {sourceType === 'article' && (
          <div className="mb-4 max-w-md mx-auto">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              📖 {locale === 'zh' ? `选择文章 (${selectedArticles.length}/3)` : `Select Articles (${selectedArticles.length}/3)`}
            </label>
            {selectedArticles.length > 0 ? (
              <div className="space-y-2 mb-2">
                {selectedArticles.map((art) => (
                  <div key={art.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {art.emoji} {art.title}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {art.vocabulary.length} {locale === 'zh' ? '个单词' : 'words'}
                      </p>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => window.location.href = '/ai-battle/article-select'}
                  className="w-full text-xs py-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 font-medium transition-colors"
                >
                  {locale === 'zh' ? '更换文章' : 'Change Articles'}
                </button>
              </div>
            ) : (
              <a
                href="/ai-battle/article-select"
                className="block text-center py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all"
              >
                📖 {locale === 'zh' ? '点击选择文章（最多 3 篇）' : 'Click to select articles (max 3)'}
              </a>
            )}
          </div>
        )}

        {/* Round count selector */}
        <div className="mb-6 max-w-md mx-auto">
          <label className="block text-xs font-medium text-gray-500 mb-2">
            🎯 {locale === 'zh' ? '题目数量' : 'Number of Questions'}
          </label>
          <div className="flex gap-2">
            {ROUND_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setTotalRounds(n)}
                disabled={n > sourceWords.length}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  totalRounds === n
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-orange-50'
                } ${n > sourceWords.length ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            {totalRounds > sourceWords.length
              ? (locale === 'zh' ? `词库仅 ${sourceWords.length} 个词，请减少题量或选择更大词库` : `Only ${sourceWords.length} words available, choose fewer questions or a larger book`)
              : (locale === 'zh' ? `共 ${totalRounds} 题，答完后 AI 同步作答` : `${totalRounds} questions, AI answers after you`)}
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-amber-500">🪙</span>
            <span className="text-sm text-gray-600">{balance}</span>
            {AI_CONFIGS[aiLevel].entryFee > 0 && (
              <span className="text-xs text-amber-600">
                (-{AI_CONFIGS[aiLevel].entryFee} {locale === 'zh' ? '入场费' : 'entry'})
              </span>
            )}
          </div>
          <button
            onClick={startBattle}
            disabled={sourceWords.length < totalRounds}
            className="px-8 py-3 rounded-xl text-base font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-sm hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ⚔️ {locale === 'zh' ? '开始对战' : 'Start Battle'}
          </button>
          {insufficientCoins && AI_CONFIGS[aiLevel].entryFee > 0 && (
            <p className="text-red-500 text-xs mt-2">
              {locale === 'zh'
                ? `金币不足，需要 ${AI_CONFIGS[aiLevel].entryFee} 金币`
                : `Need ${AI_CONFIGS[aiLevel].entryFee} coins`}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'result') {
    return (
      <div className="bg-gradient-to-br from-orange-50 via-white to-amber-50 rounded-2xl border-2 border-orange-200 p-6 md:p-8">
        <div className="text-center mb-6">
          <p className="text-5xl mb-3">
            {tie ? '🤝' : userWon ? '🎉' : '😤'}
          </p>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {tie
              ? (locale === 'zh' ? '平局！' : "It's a Tie!")
              : userWon
                ? (locale === 'zh' ? '你赢了！' : 'You Win!')
                : (locale === 'zh' ? 'AI 赢了！' : 'AI Wins!')}
          </h2>
          <p className="text-sm text-gray-400">
            {locale === 'zh'
              ? `最终比分 ${userScore} : ${aiScore}`
              : `Final Score ${userScore} : ${aiScore}`}
          </p>
        </div>

        {/* Score comparison */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
          <div className="bg-white rounded-xl p-4 text-center border-2 border-emerald-200">
            <p className="text-xs text-gray-400 mb-1">{locale === 'zh' ? '你的得分' : 'Your Score'}</p>
            <p className="text-2xl font-bold text-emerald-600">{userScore}</p>
            <p className="text-xs text-gray-400 mt-1">
              ✅ {userCorrect}/{totalRounds} {locale === 'zh' ? '正确' : 'correct'}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border-2 border-orange-200">
            <p className="text-xs text-gray-400 mb-1">{locale === 'zh' ? 'AI 得分' : 'AI Score'}</p>
            <p className="text-2xl font-bold text-orange-600">{aiScore}</p>
            <p className="text-xs text-gray-400 mt-1">
              ✅ {aiCorrect}/{totalRounds} {locale === 'zh' ? '正确' : 'correct'}
            </p>
          </div>
        </div>

        {/* Coin reward */}
        <div className="text-center mb-6">
          {(() => {
            const config = AI_CONFIGS[aiLevel]
            let reward = userCorrect * (userWon ? config.winReward : tie ? config.winReward * 0.5 : config.loseReward)
            if (userWon) reward += totalRounds * 5
            else if (tie) reward += totalRounds * 2
            const netReward = reward - config.entryFee
            if (netReward <= 0) return (
              <p className="text-sm text-gray-500">
                {locale === 'zh' ? '再接再厉！' : 'Keep trying!'}
              </p>
            )
            return (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <p className="text-lg font-bold text-amber-600">🪙 +{netReward}</p>
                <p className="text-xs text-amber-500 mt-1">
                  {locale === 'zh'
                    ? `奖励：${reward} - 入场费：${config.entryFee}`
                    : `Reward: ${reward} - Entry: ${config.entryFee}`}
                </p>
              </div>
            )
          })()}
        </div>

        {/* Ad after battle */}
        <AdInterstitial />

        <div className="flex justify-center gap-3">
          <button
            onClick={startGame}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-sm transition-all"
          >
            🔄 {locale === 'zh' ? '再来一局' : 'Play Again'}
          </button>
          <button
            onClick={() => setPhase('select')}
            className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            {locale === 'zh' ? '更换难度' : 'Change Level'}
          </button>
        </div>
      </div>
    )
  }

  // Playing phase
  const isCorrect = selectedAnswer === currentWord?.meaning
  const aiIsCorrect = aiPicked === currentWord?.meaning
  const allDone = userDone && aiDone
  const progress = (round / totalRounds) * 100

  return (
    <>
      {signupShown && <SignupModal type="register" locale={locale} onClose={handleSignupClose} />}
      <div className="bg-gradient-to-br from-orange-50 via-white to-amber-50 rounded-2xl border-2 border-orange-200 p-6 md:p-8">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>
            {locale === 'zh' ? `第 ${round + 1}/${totalRounds} 题` : `Round ${round + 1}/${totalRounds}`}
          </span>
          <span>
            {aiConfig.emoji} {locale === 'zh' ? aiConfig.labelZh : aiConfig.label}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>
            {sourceType === 'article' && selectedArticles.length > 0
              ? `📖 ${selectedArticles.map((a) => a.title).join(', ')}`
              : selectedBookId === null
                ? '📚 ' + (locale === 'zh' ? '全部词库' : 'All books')
                : `${WORD_BOOKS.find((b) => b.id === selectedBookId)?.emoji || '📚'} ${WORD_BOOKS.find((b) => b.id === selectedBookId)?.name || ''}`}
          </span>
          <span>{sourceWords.length} {locale === 'zh' ? '词' : 'words'}</span>
        </div>
      </div>

      {/* Score board */}
      <div className="flex items-center justify-between mb-5 bg-white rounded-xl px-4 py-3 shadow-sm">
        <div className="text-center flex-1">
          <p className="text-xs text-gray-400">{locale === 'zh' ? '你' : 'You'}</p>
          <p className="text-xl font-bold text-emerald-600">{userScore}</p>
          <p className="text-[10px] text-gray-400">
            ✅ {userCorrect}/{Math.min(round + (userDone ? 1 : 0), totalRounds)}
          </p>
        </div>
        <div className="text-center px-4">
          <p className="text-lg font-bold text-gray-300">VS</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-xs text-gray-400">{aiConfig.emoji} AI</p>
          <p className="text-xl font-bold text-orange-600">{aiScore}</p>
          <p className="text-[10px] text-gray-400">
            ✅ {aiCorrect}/{Math.min(round + (aiDone ? 1 : 0), totalRounds)}
          </p>
        </div>
      </div>

      {/* Question */}
      {currentWord && (
        <div className="text-center mb-5">
          <p className="text-4xl font-bold text-gray-800 mb-1">{currentWord.word}</p>
          <p className="text-sm text-gray-400">{currentWord.pinyin}</p>
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {options.map((opt) => {
          let style = 'bg-white border-gray-200 hover:bg-orange-50 hover:border-orange-300 cursor-pointer'
          if (userDone) {
            if (opt === currentWord?.meaning) {
              style = 'bg-emerald-50 border-emerald-400 text-emerald-700'
            } else if (opt === selectedAnswer && opt !== currentWord?.meaning) {
              style = 'bg-red-50 border-red-300 text-red-600'
            } else {
              style = 'bg-gray-50 border-gray-100 text-gray-400 cursor-default'
            }
          }
          return (
            <button
              key={opt}
              onClick={() => handleUserAnswer(opt)}
              disabled={userDone}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${style}`}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {/* Result display */}
      {userDone && (
        <div className="bg-white rounded-xl p-4 mb-5 space-y-2 text-sm">
          <div className={`flex items-center gap-2 ${isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
            <span>{isCorrect ? '✅' : '❌'}</span>
            <span>
              {locale === 'zh' ? '你的答案' : 'Your answer'}: {selectedAnswer}
              {isCorrect && (
                <span className="text-emerald-500 ml-2">
                  +{100 + Math.min(Math.max(0, Math.round((8 - userTime / 1000) * 3)), 30)} ({formatTime(userTime)})
                </span>
              )}
            </span>
          </div>

          {!aiDone && (
            <div className="flex items-center gap-2 text-orange-500">
              <span className="inline-block w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              <span>{locale === 'zh' ? 'AI 思考中...' : 'AI thinking...'}</span>
            </div>
          )}

          {aiDone && (
            <div className={`flex items-center gap-2 ${aiIsCorrect ? 'text-orange-600' : 'text-red-500'}`}>
              <span>{aiIsCorrect ? '✅' : '❌'}</span>
              <span>
                {aiConfig.emoji} AI {locale === 'zh' ? '答案' : 'answer'}: {aiPicked}
                {aiIsCorrect && (
                  <span className="text-orange-500 ml-2">
                    +{100 + Math.min(Math.max(0, Math.round((8 - aiTime / 1000) * 3)), 30)} ({formatTime(aiTime)})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Next button */}
      {allDone && (
        <button
          onClick={handleNext}
          className="w-full py-3 rounded-xl text-base font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-sm transition-all"
        >
          {round + 1 >= totalRounds
            ? (locale === 'zh' ? '🏆 查看结果' : '🏆 See Results')
            : (locale === 'zh' ? '下一题 →' : 'Next →')}
        </button>
      )}
      </div>
    </>
  )
}