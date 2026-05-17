'use client'

let cachedVoice: SpeechSynthesisVoice | null = null

function findBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined') return null

  const voices = window.speechSynthesis.getVoices()

  // Priority 1: Google 普通话 (Chrome, most natural)
  const googleZH = voices.find((v) => v.name.includes('Google 普通话'))
  if (googleZH) return googleZH

  // Priority 2: 任何 Google 中文语音
  const googleAnyZH = voices.find(
    (v) => v.name.includes('Google') && v.lang.startsWith('zh')
  )
  if (googleAnyZH) return googleAnyZH

  // Priority 3: Ting-Ting (macOS)
  const tingting = voices.find((v) => v.name.includes('Ting-Ting'))
  if (tingting) return tingting

  // Priority 4: 任何 zh-CN 女性语音
  const zhCN = voices.find(
    (v) => v.lang.startsWith('zh-CN') && v.name.includes('Female')
  )
  if (zhCN) return zhCN

  // Priority 5: 任何中文语音
  const anyZH = voices.find((v) => v.lang.startsWith('zh'))
  if (anyZH) return anyZH

  // Fallback: 默认语音
  return voices[0] || null
}

export function speak(text: string, options?: { rate?: number; onEnd?: () => void }) {
  if (typeof window === 'undefined') return

  // Some browsers (Chrome) need the voices reloaded
  if (!cachedVoice) {
    cachedVoice = findBestVoice()
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = options?.rate ?? 0.88
  utterance.pitch = 1.05

  if (cachedVoice) {
    utterance.voice = cachedVoice
  }

  if (options?.onEnd) {
    utterance.onend = options.onEnd
  }

  window.speechSynthesis.speak(utterance)
}

export function cancelSpeech() {
  if (typeof window !== 'undefined') {
    window.speechSynthesis.cancel()
  }
}
