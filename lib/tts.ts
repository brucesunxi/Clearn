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

/** Warm up the speech engine. Call early on page load. */
export function initVoice() {
  if (typeof window === 'undefined' || voiceReady) return

  // Trigger Chrome to start loading voices
  window.speechSynthesis.getVoices()

  const v = findBestVoice()
  if (v) {
    cachedVoice = v
    voiceReady = true
    return
  }

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
  if (typeof window === 'undefined' || !text) return

  // Chrome can pause speech synthesis; resume() unsticks it
  window.speechSynthesis.resume()

  // Keep trying to find a voice on each call
  if (!voiceReady) {
    const v = findBestVoice()
    if (v) {
      cachedVoice = v
      voiceReady = true
    }
  }

  // Cancel any previous speech
  window.speechSynthesis.cancel()

  // Chrome bug: cancel() is processed async — speak() right after can silently fail.
  // requestAnimationFrame fires after cancel is fully committed.
  requestAnimationFrame(() => {
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

    try {
      window.speechSynthesis.speak(utterance)
    } catch {
      // Some mobile browsers may throw — silently ignore
    }
  })
}

export function cancelSpeech() {
  if (typeof window !== 'undefined') {
    window.speechSynthesis.cancel()
  }
}
