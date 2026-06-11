import { useRef, useState, type FormEvent } from 'react'
import { useCreateJournal, useDashboard, useJournal } from '../api/queries.ts'
import { Card, ErrorNote, SkeletonCard } from '../components/ui.tsx'
import { getVoiceProvider } from '../voice/voice.ts'

export function Journal() {
  const [search, setSearch] = useState('')
  const { data: entries, isLoading, error } = useJournal(search)
  const { data: dash } = useDashboard()
  const create = useCreateJournal()

  const [mood, setMood] = useState(7)
  const [content, setContent] = useState('')
  const [voiceText, setVoiceText] = useState('')
  const [listening, setListening] = useState(false)
  const interimRef = useRef('')
  const voice = getVoiceProvider()

  const prompt = dash?.protocol.mindset

  const toggleVoice = () => {
    if (listening) {
      voice.stopListening()
      setListening(false)
      return
    }
    setListening(true)
    voice.startListening(
      (text, isFinal) => {
        if (isFinal) {
          setVoiceText((v) => (v ? `${v} ${text}` : text))
          interimRef.current = ''
        } else interimRef.current = text
      },
      () => setListening(false),
    )
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !voiceText.trim()) return
    create.mutate(
      {
        mood,
        content,
        voiceTranscript: voiceText || undefined,
        prompts: prompt ? [{ prompt: prompt.prompt, answer: content }] : [],
      },
      {
        onSuccess: () => {
          setContent('')
          setVoiceText('')
        },
      },
    )
  }

  return (
    <div className="page">
      <h1>Reflection & Journal</h1>

      <Card glow>
        {prompt && (
          <p className="muted" style={{ marginTop: 0 }}>
            <b style={{ color: 'var(--accent)' }}>Today’s prompt — {prompt.title}:</b> {prompt.prompt}
          </p>
        )}
        <form onSubmit={submit}>
          <label className="field">
            Mood today: <b className="mono">{mood}/10</b>
            <input type="range" min={1} max={10} value={mood} onChange={(e) => setMood(Number(e.target.value))} />
          </label>
          <label className="field">
            Free write
            <textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} placeholder="What happened. What it meant. What you learned." />
          </label>
          <div className="row wrap">
            <button
              type="button"
              className={listening ? 'primary' : ''}
              onClick={toggleVoice}
              disabled={!voice.isSupported()}
              title={voice.isSupported() ? 'Dictate a voice note (transcribed locally)' : voice.unsupportedReason}
            >
              {listening ? '◉ listening… (tap to stop)' : '🎙 Voice note'}
            </button>
            <button className="primary" disabled={create.isPending}>
              {create.isPending ? 'Saving…' : 'Save entry'}
            </button>
          </div>
          {!voice.isSupported() && <div className="tiny" style={{ marginTop: 6 }}>{voice.unsupportedReason}</div>}
          {voiceText && (
            <p className="muted" style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 10 }}>
              <b>Voice transcript:</b> {voiceText}
            </p>
          )}
        </form>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <div className="row between wrap">
          <h2>Archive</h2>
          <input style={{ width: 260 }} placeholder="Search everything… (full-text)" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {isLoading && <SkeletonCard lines={4} />}
        {error && <ErrorNote error={error} />}
        {(entries ?? []).map((j) => (
          <div key={j.id} style={{ borderTop: '1px solid var(--glass-border)', padding: '10px 0' }}>
            <div className="row between">
              <b className="mono">{j.date}</b>
              {j.mood && <span className="chip">mood {j.mood}/10</span>}
            </div>
            {j.content && <p style={{ margin: '6px 0', whiteSpace: 'pre-wrap' }}>{j.content}</p>}
            {j.voice_transcript && (
              <p className="muted" style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 10 }}>
                🎙 {j.voice_transcript}
              </p>
            )}
          </div>
        ))}
        {entries?.length === 0 && <p className="muted">Nothing found.</p>}
      </Card>
    </div>
  )
}
