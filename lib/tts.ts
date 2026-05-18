'use client'

let cachedVoice: SpeechSynthesisVoice | null = null
let initialized = false

function findChineseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((v) => v.name.includes('Google 普通话')) ||
    voices.find((v) => v.name.includes('Google') && v.lang.startsWith('zh')) ||
    voices.find((v) => v.name.includes('Ting-Ting')) ||
    voices.find((v) => v.lang.startsWith('zh')) ||
    null
  )
}

export function initVoice() {
  if (typeof window === 'undefined' || initialized) return
  initialized = true

  // Trigger Chrome to start loading voices
  window.speechSynthesis.getVoices()

  // Try to find a voice immediately
  const found = findChineseVoice()
  if (found) {
    cachedVoice = found
    return
  }

  // If not ready yet, wait for the event
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    const v = findChineseVoice()
    if (v) cachedVoice = v
  }, { once: true })
}

export function speak(text: string, options?: { onEnd?: () => void }) {
  if (typeof window === 'undefined') return
  if (!text) return

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.9

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
