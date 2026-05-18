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

  return null
}

/** Ensure voice is loaded. Call early on page load. */
export function initVoice() {
  if (typeof window === 'undefined' || voiceReady) return

  // Trigger voice loading in Chrome (first call returns empty)
  window.speechSynthesis.getVoices()

  // Try immediately in case voices already loaded
  const v = findBestVoice()
  if (v) {
    cachedVoice = v
    voiceReady = true
    return
  }

  // Listen for voice load event
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

  // Chrome bug: speech synthesis can get stuck. resume() fixes it.
  window.speechSynthesis.resume()

  // Re-check voice each call if not yet ready
  if (!voiceReady) {
    const v = findBestVoice()
    if (v) {
      cachedVoice = v
      voiceReady = true
    }
  }

  // Cancel previous speech
  window.speechSynthesis.cancel()

  // Chrome bug: cancel + speak in same tick can fail.
  // Defer to next tick so cancel completes first.
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = options?.rate ?? 0.85
    utterance.pitch = 1.0
    utterance.volume = 1.0

    if (cachedVoice) {
      utterance.voice = cachedVoice
    }

    if (options?.onEnd) {
      utterance.onend = options.onEnd
    }

    utterance.onerror = () => {
      // Chrome may fire error during rapid navigation — safe to ignore
    }

    window.speechSynthesis.speak(utterance)
  }, 50)
}

export function cancelSpeech() {
  if (typeof window !== 'undefined') {
    window.speechSynthesis.cancel()
  }
}
