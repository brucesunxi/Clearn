'use client'

let preferredVoice: SpeechSynthesisVoice | null = null
let voicesLoaded = false
let serverTTS: string[] = [] // cache of TTS audio URLs

// ---- Browser voice selection ----

function pickBestChineseVoice(voices: SpeechSynthesisVoice[]) {
  const preferred = [
    ['xiaoxiao', 'xiao xiao'],   // Edge/Windows - best Chinese female
    ['tingting', 'ting ting'],   // macOS Siri
    ['meijia', 'mei jia'],       // macOS
    ['yaoyao', 'yao yao'],       // Windows
    ['huihui', 'hui hui'],       // Windows
  ]
  const zhVoices = voices.filter((v) => v.lang.startsWith('zh'))
  for (const names of preferred) {
    const match = zhVoices.find((v) =>
      names.some((n) => v.name.toLowerCase().replace(/\s/g, '').includes(n))
    )
    if (match) return match
  }
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

// ---- Server-side TTS (better quality) ----
// Falls back to browser TTS if server is unavailable

let serverAvailable = true

async function speakViaServer(text: string): Promise<boolean> {
  if (!serverAvailable) return false
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) {
      serverAvailable = false
      return false
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    await audio.play()
    // Cleanup URL after playback ends
    audio.onended = () => URL.revokeObjectURL(url)
    return true
  } catch {
    serverAvailable = false
    return false
  }
}

// ---- Browser SpeechSynthesis (with Chrome bug fix) ----

function browserSpeak(text: string, options?: { onEnd?: () => void }) {
  if (typeof window === 'undefined' || !text) return

  if (!voicesLoaded) {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      preferredVoice = pickBestChineseVoice(voices)
      voicesLoaded = true
    }
  }

  // Cancel any in-progress speech first
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.9
  utterance.pitch = 1.0
  if (preferredVoice) utterance.voice = preferredVoice

  if (options?.onEnd) {
    utterance.onend = options.onEnd
  }

  // Chrome bug workaround: speechSynthesis sometimes stops after ~15 utterances.
  // Resetting by calling pause/resume prevents the silent bug.
  window.speechSynthesis.speak(utterance)

  // Chrome bug: speechSynthesis pauses after being idle for a while
  if ((window as any).chrome) {
    setTimeout(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }
    }, 100)
  }
}

// ---- Public API ----

export async function speak(text: string, options?: { onEnd?: () => void }) {
  if (!text) return

  // Try server-side TTS first (produces consistent high-quality audio)
  const serverOk = await speakViaServer(text)
  if (serverOk) {
    options?.onEnd?.()
    return
  }

  // Fallback to browser SpeechSynthesis
  browserSpeak(text, options)
}

export function cancelSpeech() {
  if (typeof window !== 'undefined') {
    window.speechSynthesis.cancel()
  }
}
