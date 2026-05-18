'use client'

export function initVoice() {
  if (typeof window === 'undefined') return
  window.speechSynthesis.getVoices()
}

export function speak(text: string, options?: { onEnd?: () => void }) {
  // Bare minimum — exactly matching the console test that worked
  if (typeof window === 'undefined') return
  if (!text) return

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'

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
