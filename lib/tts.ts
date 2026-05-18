'use client'

export function initVoice() {
  if (typeof window === 'undefined') return
  window.speechSynthesis.getVoices()
}

export function speak(text: string, options?: { onEnd?: () => void }) {
  if (typeof window === 'undefined') return
  if (!text) return

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.9

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
