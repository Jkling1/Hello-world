import type { FastifyInstance } from 'fastify'
import type { DB } from '../db.ts'
import { getInjuries, setSetting, today } from '../state.ts'
import { getProviderInfo, selectProvider } from '../coach/provider.ts'
import { assembleCoachContext } from '../coach/context.ts'
import { extractFromExchange } from '../coach/memory.ts'
import { parseStrictJson, validateAdjustment, validateTasks } from '../coach/json.ts'

const MAX_BIG_ROCKS = 3

export function registerCoachRoutes(app: FastifyInstance, db: DB): void {
  app.get('/api/coach/status', async () => getProviderInfo())

  app.get('/api/coach/conversations', async () =>
    db
      .prepare(
        `SELECT c.*, (SELECT COUNT(*) FROM coach_messages m WHERE m.conversation_id = c.id) AS message_count
         FROM coach_conversations c ORDER BY updated_at DESC`,
      )
      .all(),
  )

  app.post<{ Body: { title?: string } }>('/api/coach/conversations', async (req, reply) => {
    const info = db
      .prepare('INSERT INTO coach_conversations (title) VALUES (?)')
      .run(req.body?.title ?? `Check-in ${today()}`)
    reply.code(201)
    return db.prepare('SELECT * FROM coach_conversations WHERE id = ?').get(info.lastInsertRowid)
  })

  app.get<{ Params: { id: string } }>('/api/coach/conversations/:id/messages', async (req) =>
    db.prepare('SELECT * FROM coach_messages WHERE conversation_id = ? ORDER BY id').all(req.params.id),
  )

  /**
   * Streaming chat over SSE (POST + fetch-stream on the client).
   * Persists both sides, then fires memory extraction.
   */
  app.post<{ Body: { conversationId?: number; message: string } }>(
    '/api/coach/chat',
    {
      schema: {
        body: {
          type: 'object',
          required: ['message'],
          properties: { conversationId: { type: 'integer' }, message: { type: 'string', minLength: 1 } },
        },
      },
    },
    async (req, reply) => {
      let conversationId = req.body.conversationId
      if (!conversationId) {
        conversationId = Number(
          db.prepare('INSERT INTO coach_conversations (title) VALUES (?)').run(`Check-in ${today()}`).lastInsertRowid,
        )
      }
      const userMessage = req.body.message.trim()
      db.prepare('INSERT INTO coach_messages (conversation_id, role, content) VALUES (?, ?, ?)').run(
        conversationId,
        'user',
        userMessage,
      )
      db.prepare(`UPDATE coach_conversations SET updated_at = datetime('now') WHERE id = ?`).run(conversationId)

      const { system, messages } = assembleCoachContext(db, { date: today(), conversationId })

      reply.raw.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
        'x-accel-buffering': 'no',
      })
      reply.hijack()

      const send = (data: unknown) => reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)
      send({ conversationId })

      const heartbeat = setInterval(() => reply.raw.write(': ping\n\n'), 15_000)
      // Note: req.raw 'close' fires when the request body finishes (not on
      // disconnect) — client disconnects surface on the response object.
      let aborted = false
      reply.raw.on('close', () => {
        aborted = true
      })

      let full = ''
      try {
        const provider = selectProvider()
        for await (const delta of provider.streamChat({ system, messages, maxTokens: 1200 })) {
          if (aborted) break
          full += delta
          send({ delta })
        }
        const info = db
          .prepare('INSERT INTO coach_messages (conversation_id, role, content) VALUES (?, ?, ?)')
          .run(conversationId, 'assistant', full || '(no response)')
        send({ done: true, messageId: Number(info.lastInsertRowid) })
        extractFromExchange(db, userMessage, full, Number(info.lastInsertRowid))
      } catch (err) {
        send({ error: (err as Error).message || 'coach stream failed' })
      } finally {
        clearInterval(heartbeat)
        reply.raw.end()
      }
    },
  )

  /** Strict-JSON task generation — parsed defensively, capped, inserted as origin='coach'. */
  app.post<{ Body: { date?: string; instruction?: string } }>('/api/coach/generate-tasks', async (req, reply) => {
    const date = req.body?.date ?? today()
    const { system } = assembleCoachContext(db, { date })
    const provider = selectProvider()
    const raw = await provider.complete({
      system,
      prompt: `Generate today's task list for Jordan${req.body?.instruction ? ` — instruction: ${req.body.instruction}` : ''}.
Return ONLY a JSON object, no prose, no code fences, exactly this shape:
{"tasks":[{"title":"...","category":"Fitness|Mindset|Knowledge|Social|Business|Money","bigRock":true|false,"cadence":"daily|weekly|monthly|yearly"}]}
3-5 tasks max, at most 1 with bigRock true.`,
      maxTokens: 800,
    })
    const parsed = parseStrictJson(raw, validateTasks)
    if (!parsed) return reply.code(422).send({ error: 'invalid_model_output', raw: raw.slice(0, 500) })

    const exists = db.prepare('SELECT 1 FROM tasks WHERE date = ? AND title = ? LIMIT 1')
    const insert = db.prepare(
      `INSERT INTO tasks (date, title, category, cadence, big_rock, origin, source) VALUES (?, ?, ?, ?, ?, 'coach', 'coach')`,
    )
    const created: unknown[] = []
    for (const t of parsed.tasks) {
      if (exists.get(date, t.title)) continue
      const rocks = (db.prepare('SELECT COUNT(*) AS n FROM tasks WHERE date = ? AND big_rock = 1').get(date) as { n: number }).n
      const bigRock = t.bigRock && rocks < MAX_BIG_ROCKS ? 1 : 0
      const info = insert.run(date, t.title, t.category, t.cadence, bigRock)
      created.push(db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid))
    }
    return { created }
  })

  /** Plain-language plan adjustment → structured changes, applied to live state. */
  app.post<{ Body: { message: string } }>(
    '/api/coach/adjust-plan',
    {
      schema: { body: { type: 'object', required: ['message'], properties: { message: { type: 'string', minLength: 1 } } } },
    },
    async (req, reply) => {
      const date = today()
      const { system } = assembleCoachContext(db, { date })
      const provider = selectProvider()
      const raw = await provider.complete({
        system,
        prompt: `Jordan says: "${req.body.message}"
Decide how to adjust the plan. Return ONLY a JSON object, no prose, no code fences:
{"summary":"plain-language explanation for Jordan","stateOverrides":{"activeDeloadWeek":true|false,"injuries":[{"area":"knee|ankle|foot|hip|back|shoulder","severity":1|2|3}]},"taskChanges":[]}
Only include stateOverrides keys you actually want to change.`,
        maxTokens: 700,
      })
      const parsed = parseStrictJson(raw, validateAdjustment)
      if (!parsed) return reply.code(422).send({ error: 'invalid_model_output', raw: raw.slice(0, 500) })

      if (parsed.stateOverrides.activeDeloadWeek !== undefined) {
        setSetting(db, 'active_deload_week', parsed.stateOverrides.activeDeloadWeek ? '1' : '0')
      }
      if (parsed.stateOverrides.injuries) {
        const merged = [...getInjuries(db)]
        for (const inj of parsed.stateOverrides.injuries) {
          if (!merged.some((m) => m.area === inj.area)) merged.push(inj as never)
        }
        setSetting(db, 'current_injuries', JSON.stringify(merged))
      }
      return { applied: parsed }
    },
  )

  app.get('/api/coach/memories', async () =>
    db.prepare('SELECT * FROM coach_memories WHERE archived = 0 ORDER BY salience DESC, created_at DESC').all(),
  )

  app.delete<{ Params: { id: string } }>('/api/coach/memories/:id', async (req, reply) => {
    const info = db.prepare('UPDATE coach_memories SET archived = 1 WHERE id = ?').run(req.params.id)
    if (info.changes === 0) return reply.code(404).send({ error: 'not found' })
    return { ok: true }
  })
}
