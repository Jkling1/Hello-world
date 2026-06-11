import type { FastifyInstance } from 'fastify'
import { formatProtocolMarkdown, generateDailyProtocol, generateWeek } from '@vantage/engine'
import type { DB } from '../db.ts'
import { buildUserState, getProgramConfig, today } from '../state.ts'
import { evaluateAchievements } from '../achievements.ts'

const DATE_RX = '^\\d{4}-\\d{2}-\\d{2}$'

export function registerTrainingRoutes(app: FastifyInstance, db: DB): void {
  /** Generate (and archive) the protocol for a date, adapted to live state. */
  app.get<{ Querystring: { date?: string } }>('/api/protocol', async (req) => {
    const date = req.query.date ?? today()
    const config = getProgramConfig(db)
    const state = buildUserState(db, date)
    const protocol = generateDailyProtocol(date, state, config)
    const markdown = formatProtocolMarkdown(protocol)
    db.prepare(
      `INSERT INTO protocols (date, protocol_json, markdown, state_json)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET protocol_json = excluded.protocol_json,
         markdown = excluded.markdown, state_json = excluded.state_json, generated_at = datetime('now')`,
    ).run(date, JSON.stringify(protocol), markdown, JSON.stringify(state))
    return { protocol, markdown, state }
  })

  app.get<{ Querystring: { start?: string } }>('/api/protocol/week', async (req) => {
    const start = req.query.start ?? today()
    const config = getProgramConfig(db)
    const state = buildUserState(db, start)
    return { days: generateWeek(start, state, config), state }
  })

  app.get<{ Querystring: { date?: string } }>('/api/state', async (req) => {
    return buildUserState(db, req.query.date ?? today())
  })

  // ---- Workouts ----------------------------------------------------------

  app.get<{ Querystring: { from?: string; to?: string; type?: string; limit?: number } }>(
    '/api/workouts',
    async (req) => {
      const { from = '0000', to = '9999', type, limit = 200 } = req.query
      const rows = type
        ? db
            .prepare('SELECT * FROM workouts WHERE date >= ? AND date <= ? AND type = ? ORDER BY date DESC, id DESC LIMIT ?')
            .all(from, to, type, limit)
        : db
            .prepare('SELECT * FROM workouts WHERE date >= ? AND date <= ? ORDER BY date DESC, id DESC LIMIT ?')
            .all(from, to, limit)
      return rows
    },
  )

  app.post<{ Body: Record<string, unknown> }>(
    '/api/workouts',
    {
      schema: {
        body: {
          type: 'object',
          required: ['date', 'type', 'durationMin', 'feeling'],
          properties: {
            date: { type: 'string', pattern: DATE_RX },
            type: { type: 'string', enum: ['run', 'swim', 'bike', 'strength', 'brick', 'mobility', 'other'] },
            title: { type: 'string' },
            durationMin: { type: 'number', minimum: 1 },
            distanceKm: { type: 'number', minimum: 0 },
            effort: { type: 'integer', minimum: 1, maximum: 10 },
            zones: { type: 'array' },
            feeling: { type: 'string', minLength: 1 },
            notes: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const b = req.body as Record<string, never>
      const info = db
        .prepare(
          `INSERT INTO workouts (date, type, title, duration_min, distance_km, effort, zones, feeling, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          b.date,
          b.type,
          b.title ?? null,
          b.durationMin,
          b.distanceKm ?? null,
          b.effort ?? null,
          JSON.stringify(b.zones ?? []),
          b.feeling,
          b.notes ?? null,
        )
      // logging a workout marks the day as not-missed
      db.prepare(
        `INSERT INTO daily_logs (date, missed_workout) VALUES (?, 0)
         ON CONFLICT(date) DO UPDATE SET missed_workout = 0`,
      ).run(b.date)
      const unlocked = evaluateAchievements(db, today())
      reply.code(201)
      return { workout: db.prepare('SELECT * FROM workouts WHERE id = ?').get(info.lastInsertRowid), unlocked }
    },
  )

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>('/api/workouts/:id', async (req, reply) => {
    const fields: Record<string, string> = {
      date: 'date',
      type: 'type',
      title: 'title',
      durationMin: 'duration_min',
      distanceKm: 'distance_km',
      effort: 'effort',
      feeling: 'feeling',
      notes: 'notes',
    }
    const sets: string[] = []
    const vals: unknown[] = []
    for (const [key, col] of Object.entries(fields)) {
      if ((req.body as never)[key] !== undefined) {
        sets.push(`${col} = ?`)
        vals.push((req.body as never)[key])
      }
    }
    if (sets.length === 0) return reply.code(400).send({ error: 'no fields to update' })
    const info = db.prepare(`UPDATE workouts SET ${sets.join(', ')} WHERE id = ?`).run(...vals, req.params.id)
    if (info.changes === 0) return reply.code(404).send({ error: 'not found' })
    return db.prepare('SELECT * FROM workouts WHERE id = ?').get(req.params.id)
  })

  app.delete<{ Params: { id: string } }>('/api/workouts/:id', async (req, reply) => {
    const info = db.prepare('DELETE FROM workouts WHERE id = ?').run(req.params.id)
    if (info.changes === 0) return reply.code(404).send({ error: 'not found' })
    return { ok: true }
  })

  // ---- Daily logs --------------------------------------------------------

  app.get<{ Querystring: { from?: string; to?: string } }>('/api/logs', async (req) => {
    const { from = '0000', to = '9999' } = req.query
    return db.prepare('SELECT * FROM daily_logs WHERE date >= ? AND date <= ? ORDER BY date DESC').all(from, to)
  })

  app.put<{ Params: { date: string }; Body: Record<string, unknown> }>(
    '/api/logs/:date',
    {
      schema: {
        params: { type: 'object', properties: { date: { type: 'string', pattern: DATE_RX } } },
        body: {
          type: 'object',
          properties: {
            fatigue: { type: ['integer', 'null'], minimum: 1, maximum: 10 },
            mood: { type: ['integer', 'null'], minimum: 1, maximum: 10 },
            sleepHours: { type: ['number', 'null'], minimum: 0, maximum: 24 },
            adherence: { type: ['number', 'null'], minimum: 0, maximum: 1 },
            missedWorkout: { type: 'boolean' },
            notes: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (req) => {
      const b = req.body as Record<string, never>
      db.prepare(
        `INSERT INTO daily_logs (date, fatigue, mood, sleep_hours, adherence, missed_workout, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(date) DO UPDATE SET
           fatigue = COALESCE(excluded.fatigue, daily_logs.fatigue),
           mood = COALESCE(excluded.mood, daily_logs.mood),
           sleep_hours = COALESCE(excluded.sleep_hours, daily_logs.sleep_hours),
           adherence = COALESCE(excluded.adherence, daily_logs.adherence),
           missed_workout = excluded.missed_workout,
           notes = COALESCE(excluded.notes, daily_logs.notes)`,
      ).run(
        req.params.date,
        b.fatigue ?? null,
        b.mood ?? null,
        b.sleepHours ?? null,
        b.adherence ?? null,
        b.missedWorkout ? 1 : 0,
        b.notes ?? null,
      )
      return db.prepare('SELECT * FROM daily_logs WHERE date = ?').get(req.params.date)
    },
  )
}
