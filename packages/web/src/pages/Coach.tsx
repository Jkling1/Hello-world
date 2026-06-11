import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { post } from '../api/client.ts'
import { streamCoachChat } from '../api/client.ts'
import { useCoachMemories, useCoachStatus, useTaskMutations } from '../api/queries.ts'
import { Card } from '../components/ui.tsx'
import { getVoiceProvider } from '../voice/voice.ts'

interface LocalMsg {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export function Coach() {
  const { data: status } = useCoachStatus()
  const { data: memories } = useCoachMemories()
  const qc = useQueryClient()
  const { materialize } = useTaskMutations()

  const [messages, setMessages] = useState<LocalMsg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [listening, setListening] = useState(false)
  const [showMemories, setShowMemories] = useState(false)
  const conversationRef = useRef<number | undefined>(undefined)
  const logRef = useRef<HTMLDivElement>(null)
  const voice = getVoiceProvider()

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || busy) return
    setBusy(true)
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: message }, { role: 'assistant', content: '', streaming: true }])
    let assembled = ''
    try {
      await streamCoachChat({ conversationId: conversationRef.current, message }, (e) => {
        if (e.conversationId) conversationRef.current = e.conversationId
        if (e.delta) {
          assembled += e.delta
          setMessages((m) => {
            const next = [...m]
            next[next.length - 1] = { role: 'assistant', content: assembled, streaming: true }
            return next
          })
        }
        if (e.error) assembled += `\n[coach error: ${e.error}]`
      })
    } catch (err) {
      assembled += `\n[connection lost: ${(err as Error).message}]`
    }
    setMessages((m) => {
      const next = [...m]
      next[next.length - 1] = { role: 'assistant', content: assembled || '(no response)' }
      return next
    })
    setBusy(false)
    qc.invalidateQueries({ queryKey: ['coach-memories'] })
    if (voiceMode) voice.speak(assembled)
  }

  const toggleListening = () => {
    if (listening) {
      voice.stopListening()
      setListening(false)
      return
    }
    voice.stopSpeaking()
    setListening(true)
    let finalText = ''
    voice.startListening(
      (text, isFinal) => {
        if (isFinal) finalText += ` ${text}`
        setInput((finalText + (isFinal ? '' : ` ${text}`)).trim())
      },
      () => {
        setListening(false)
        if (finalText.trim()) send(finalText)
      },
    )
  }

  const generateTasks = async () => {
    setBusy(true)
    try {
      await post('/api/coach/generate-tasks', {})
      qc.invalidateQueries()
      setMessages((m) => [...m, { role: 'assistant', content: '✓ Tasks generated and added to today’s missions. Go check the board.' }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: `Task generation failed: ${(err as Error).message}` }])
    }
    setBusy(false)
  }

  const adjustPlan = async () => {
    const message = input.trim() || window.prompt('Tell the coach what’s going on (plain language):', 'I’m wrecked today') || ''
    if (!message) return
    setBusy(true)
    setInput('')
    try {
      const r = await post<{ applied: { summary: string } }>('/api/coach/adjust-plan', { message })
      qc.invalidateQueries()
      setMessages((m) => [...m, { role: 'user', content: message }, { role: 'assistant', content: `📋 Plan adjusted — ${r.applied.summary}` }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: `Adjustment failed: ${(err as Error).message}` }])
    }
    setBusy(false)
  }

  return (
    <div className="page">
      <div className="row between wrap">
        <h1>Coach</h1>
        <div className="row">
          {status && (
            <span className={`badge ${status.hasKey ? 'success' : 'warn'}`} title={status.hasKey ? status.model : 'Add ANTHROPIC_API_KEY to .env for the live coach'}>
              {status.hasKey ? `live · ${status.model}` : 'mock mode — keyless'}
            </span>
          )}
          <button className={voiceMode ? 'primary' : ''} onClick={() => setVoiceMode(!voiceMode)} disabled={!voice.isSupported()} title={voice.isSupported() ? 'Coach speaks replies aloud' : voice.unsupportedReason}>
            🔊 voice {voiceMode ? 'on' : 'off'}
          </button>
          <button onClick={() => setShowMemories(!showMemories)}>🧠 {memories?.length ?? 0}</button>
        </div>
      </div>

      {showMemories && (
        <Card style={{ marginBottom: 16 }}>
          <h2>What I remember</h2>
          <ul className="clean">
            {(memories ?? []).map((m) => (
              <li key={m.id} className="row between">
                <span>
                  <span className="chip">{m.category}</span> {m.content}
                </span>
                <span className="mono tiny">salience {m.salience}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card glow>
        <div className="chat-log" ref={logRef}>
          {messages.length === 0 && (
            <p className="muted">
              I have your full context — today’s protocol, your logs, your journal, your own words from weeks ago. Ask me
              anything, tell me how you actually feel, or hit a quick action below.
              <br />
              <span className="tiny">You built me to get you across the Ironman Florida finish line. Let’s work.</span>
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role} ${m.streaming ? 'cursor-blink' : ''}`}>
              {m.content}
            </div>
          ))}
        </div>
        <hr className="divider" />
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
        >
          <button type="button" className={listening ? 'primary' : ''} onClick={toggleListening} disabled={!voice.isSupported() || busy} title={voice.isSupported() ? 'Talk to the coach' : voice.unsupportedReason}>
            {listening ? '◉' : '🎙'}
          </button>
          <input style={{ flex: 1 }} placeholder={listening ? 'Listening…' : 'Talk to your coach…'} value={input} onChange={(e) => setInput(e.target.value)} disabled={busy} />
          <button className="primary" disabled={busy || !input.trim()}>
            {busy ? '…' : 'Send'}
          </button>
        </form>
        <div className="row wrap" style={{ marginTop: 10 }}>
          <button className="small" onClick={generateTasks} disabled={busy}>⚙ Generate today’s tasks</button>
          <button className="small" onClick={adjustPlan} disabled={busy}>📋 Adjust my plan</button>
          <button className="small" onClick={() => send('Give me a pre-session pep talk for today’s workout.')} disabled={busy}>⚡ Pre-session pep</button>
          <button className="small" onClick={() => send('Review my recent journal entries for patterns and hold me accountable.')} disabled={busy}>🪞 Accountability check-in</button>
          <button className="small" onClick={() => materialize.mutate(undefined)} disabled={busy}>☑ Materialize life systems</button>
        </div>
      </Card>
    </div>
  )
}
