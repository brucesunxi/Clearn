'use client'

let preferredVoice: SpeechSynthesisVoice | null = null
let voicesLoaded = false

/** Get the best available Chinese voice */
function pickBestChineseVoice(voices: SpeechSynthesisVoice[]) {
  // Preferred Chinese voice names (ordered by quality)
  const preferred = [
    ['xiaoxiao', 'xiao xiao'],   // Microsoft Edge - excellent
    ['tingting', 'ting ting'],   // macOS - very good
    ['meijia', 'mei jia'],       // macOS
    ['yaoyao', 'yao yao'],       // Windows
    ['huihui', 'hui hui'],       // Windows
    ['xiaohan'],                 // Microsoft
    ['xiaoyi'],                  // Microsoft
    ['zhixi'],                   // Android
    ['daxia'],                   // Linux
  ]

  const zhVoices = voices.filter((v) => v.lang.startsWith('zh'))

  for (const names of preferred) {
    const match = zhVoices.find((v) =>
      names.some((n) => v.name.toLowerCase().replace(/\s/g, '').includes(n))
    )
    if (match) return match
  }

  // Fallback: any zh-CN voice
  return zhVoices.find((v) => v.lang === 'zh-CN') || zhVoices[0] || null
}

export function initVoice() {
  if (typeof window === 'undefined') return

  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) {
    preferredVoice = pickBestChineseVoice(voices)
    voicesLoaded = true
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      preferredVoice = pickBestChineseVoice(window.speechSynthesis.getVoices())
      voicesLoaded = true
    }
  }
}

export function speak(text: string, options?: { onEnd?: () => void }) {
  if (typeof window === 'undefined' || !text) return

  // Ensure voices are loaded
  if (!voicesLoaded) {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      preferredVoice = pickBestChineseVoice(voices)
      voicesLoaded = true
    }
  }

  // Cancel previous speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.9
  utterance.pitch = 1.0

  if (preferredVoice) {
    utterance.voice = preferredVoice
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
