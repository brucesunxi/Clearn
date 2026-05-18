'use client'

export function initVoice() {
  if (typeof window === 'undefined') return
  window.speechSynthesis.getVoices()
}

export function speak(text: string, options?: { onEnd?: () => void }) {
  if (typeof window === 'undefined') return
  if (!('speechSynthesis' in window)) return
  if (!text) return

  // Try to find a good Chinese voice
  const voices = window.speechSynthesis.getVoices()
  const chineseVoice =
    voices.find((v) => v.name.includes('Google 普通话')) ||
    voices.find((v) => v.name.includes('Google') && v.lang.startsWith('zh')) ||
    voices.find((v) => v.name.includes('Ting-Ting')) ||
    voices.find((v) => v.lang.startsWith('zh'))

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.9

  if (chineseVoice) {
    utterance.voice = chineseVoice
  }

  if (options?.onEnd) {
    utterance.onend = options.onEnd
  }

  window.speechSynthesis.speak(utterance)
}

export function cancelSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}
