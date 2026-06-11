/**
 * Pluggable voice layer. v1 ships the browser Web Speech API (zero keys);
 * a Whisper/cloud-TTS provider can implement the same interface later.
 */
export interface VoiceProvider {
  id: string
  /** false in headless/unsupported environments — UI must degrade gracefully */
  isSupported(): boolean
  unsupportedReason?: string
  startListening(onTranscript: (text: string, isFinal: boolean) => void, onEnd: () => void): void
  stopListening(): void
  speak(text: string, onDone?: () => void): void
  stopSpeaking(): void
}

type SpeechRecognitionLike = {
  new (): {
    continuous: boolean
    interimResults: boolean
    lang: string
    onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null
    onend: (() => void) | null
    onerror: (() => void) | null
    start(): void
    stop(): void
  }
}

function getRecognitionCtor(): SpeechRecognitionLike | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SpeechRecognitionLike | null
}

class WebSpeechProvider implements VoiceProvider {
  id = 'web-speech'
  unsupportedReason = 'This browser does not expose the Web Speech API. Try Chrome/Edge, or configure a Whisper provider.'
  private recognition: InstanceType<SpeechRecognitionLike> | null = null

  isSupported(): boolean {
    return getRecognitionCtor() !== null && typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  startListening(onTranscript: (text: string, isFinal: boolean) => void, onEnd: () => void): void {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return onEnd()
    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) onTranscript(r[0].transcript, true)
        else interim += r[0].transcript
      }
      if (interim) onTranscript(interim, false)
    }
    rec.onend = onEnd
    rec.onerror = onEnd
    this.recognition = rec
    try {
      rec.start()
    } catch {
      onEnd()
    }
  }

  stopListening(): void {
    try {
      this.recognition?.stop()
    } catch {
      /* already stopped */
    }
    this.recognition = null
  }

  speak(text: string, onDone?: () => void): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return onDone?.()
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''))
    utterance.rate = 1.05
    if (onDone) utterance.onend = onDone
    window.speechSynthesis.speak(utterance)
  }

  stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
  }
}

/** Stub showing where a server-side Whisper/TTS provider plugs in. */
class WhisperStubProvider implements VoiceProvider {
  id = 'whisper-stub'
  unsupportedReason = 'Whisper transcription is not configured — add a transcription API key and implement the provider.'
  isSupported(): boolean {
    return false
  }
  startListening(_t: never, onEnd: () => void): void {
    onEnd()
  }
  stopListening(): void {}
  speak(_text: string, onDone?: () => void): void {
    onDone?.()
  }
  stopSpeaking(): void {}
}

const providers: VoiceProvider[] = [new WebSpeechProvider(), new WhisperStubProvider()]

export function getVoiceProvider(): VoiceProvider {
  return providers.find((p) => p.isSupported()) ?? providers[0]
}
