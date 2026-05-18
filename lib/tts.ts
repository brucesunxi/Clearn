'use client'

export function initVoice() {
  if (typeof window === 'undefined') return
  window.speechSynthesis.getVoices()
}

export function speak(text: string, options?: { onEnd?: () => void }) {
  if (typeof window === 'undefined') return
  if (!text) return

  // Find the most natural Chinese voice available
  const voices = window.speechSynthesis.getVoices()
  const bestVoice =
    voices.find((v) => v.name.includes('Google 普通话')) ||
    voices.find((v) => v.name.includes('Google') && v.lang.startsWith('zh')) ||
    voices.find((v) => v.name.includes('Ting-Ting')) ||
    voices.find((v) => v.lang.startsWith('zh'))

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.9

  if (bestVoice) {
    utterance.voice = bestVoice
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
