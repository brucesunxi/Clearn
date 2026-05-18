'use client'

let cachedVoice: SpeechSynthesisVoice | null = null
let voiceReady = false

function findBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined') return null

  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null

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

  // Fallback: macOS Sin-Ji or default
  const sinji = voices.find((v) => v.name.includes('Sin-Ji'))
  if (sinji) return sinji

  return null
}

/** Ensure voice cache is populated. Call early (e.g. on first user interaction). */
export function initVoice() {
  if (typeof window === 'undefined' || voiceReady) return

  // Try immediately (works if voices already loaded)
  const v = findBestVoice()
  if (v) {
    cachedVoice = v
    voiceReady = true
    return
  }

  // Listen for voice load event and retry
  const onChanged = () => {
    const found = findBestVoice()
    if (found) {
      cachedVoice = found
      voiceReady = true
      window.speechSynthesis.removeEventListener('voiceschanged', onChanged)
    }
  }
  window.speechSynthesis.addEventListener('voiceschanged', onChanged)
}

export function speak(text: string, options?: { rate?: number; onEnd?: () => void }) {
  if (typeof window === 'undefined') return

  // Re-check voice each time if not yet ready
  if (!voiceReady) {
    const v = findBestVoice()
    if (v) {
      cachedVoice = v
      voiceReady = true
    }
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = options?.rate ?? 0.85
  utterance.pitch = 1.0

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
