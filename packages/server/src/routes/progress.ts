import type { FastifyInstance } from 'fastify'
import type { DB } from '../db.ts'
import { today } from '../state.ts'
import { evaluateAchievements } from '../achievements.ts'
import { heatmap, powerLevel, raceProjection, trainingLoad, volumeBuckets } from '../analytics.ts'

export function registerProgressRoutes(app: FastifyInstance, db: DB): void {
  // ---- Milestones --------------------------------------------------------

  app.get('/api/milestones', async () => db.prepare('SELECT * FROM milestones ORDER BY sort_order, id').all())

  app.post<{ Body: Record<string, unknown> }>(
    '/api/milestones',
    {
      schema: {
        body: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            targetDate: { type: ['string', 'null'] },
            sortOrder: { type: 'integer' },
          },
        },
      },
    },
    async (req, reply) => {
      const b = req.body as Record<string, never>
      const info = db
        .prepare('INSERT INTO milestones (title, description, target_date, sort_order) VALUES (?, ?, ?, ?)')
        .run(b.title, b.description ?? null, b.targetDate ?? null, b.sortOrder ?? 99)
      reply.code(201)
      return db.prepare('SELECT * FROM milestones WHERE id = ?').get(info.lastInsertRowid)
    },
  )

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>('/api/milestones/:id', async (req, reply) => {
    const b = req.body as Record<string, never>
    const sets: string[] = []
    const vals: unknown[] = []
    if (b.title !== undefined) (sets.push('title = ?'), vals.push(b.title))
    if (b.description !== undefined) (sets.push('description = ?'), vals.push(b.description))
    if (b.targetDate !== undefined) (sets.push('target_date = ?'), vals.push(b.targetDate))
    if (b.completed !== undefined) {
      sets.push('completed = ?', 'completed_at = ?')
      vals.push(b.completed ? 1 : 0, b.completed ? today() : null)
    }
    if (sets.length === 0) return reply.code(400).send({ error: 'no fields to update' })
    const info = db.prepare(`UPDATE milestones SET ${sets.join(', ')} WHERE id = ?`).run(...vals, req.params.id)
    if (info.changes === 0) return reply.code(404).send({ error: 'not found' })
    const unlocked = evaluateAchievements(db, today())
    return { milestone: db.prepare('SELECT * FROM milestones WHERE id = ?').get(req.params.id), unlocked }
  })

  app.delete<{ Params: { id: string } }>('/api/milestones/:id', async (req, reply) => {
    const info = db.prepare('DELETE FROM milestones WHERE id = ?').run(req.params.id)
    if (info.changes === 0) return reply.code(404).send({ error: 'not found' })
    return { ok: true }
  })

  // ---- Budget Reactor ----------------------------------------------------

  app.get('/api/budget', async () => {
    const items = db.prepare('SELECT * FROM budget_items ORDER BY sort_order, id').all() as Array<{
      planned_cents: number
      spent_cents: number
    }>
    const planned = items.reduce((s, i) => s + i.planned_cents, 0)
    const spent = items.reduce((s, i) => s + i.spent_cents, 0)
    return { items, totals: { planned_cents: planned, spent_cents: spent, pct: planned > 0 ? Math.round((spent / planned) * 100) : 0 } }
  })

  app.post<{ Body: Record<string, unknown> }>(
    '/api/budget',
    {
      schema: {
        body: {
          type: 'object',
          required: ['label'],
          properties: {
            label: { type: 'string', minLength: 1 },
            plannedCents: { type: 'integer', minimum: 0 },
            spentCents: { type: 'integer', minimum: 0 },
          },
        },
      },
    },
    async (req, reply) => {
      const b = req.body as Record<string, never>
      const info = db
        .prepare('INSERT INTO budget_items (label, planned_cents, spent_cents, sort_order) VALUES (?, ?, ?, 99)')
        .run(b.label, b.plannedCents ?? 0, b.spentCents ?? 0)
      reply.code(201)
      return db.prepare('SELECT * FROM budget_items WHERE id = ?').get(info.lastInsertRowid)
    },
  )

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>('/api/budget/:id', async (req, reply) => {
    const b = req.body as Record<string, never>
    const sets: string[] = []
    const vals: unknown[] = []
    if (b.label !== undefined) (sets.push('label = ?'), vals.push(b.label))
    if (b.plannedCents !== undefined) (sets.push('planned_cents = ?'), vals.push(Math.max(0, b.plannedCents as number)))
    if (b.spentCents !== undefined) (sets.push('spent_cents = ?'), vals.push(Math.max(0, b.spentCents as number)))
    if (sets.length === 0) return reply.code(400).send({ error: 'no fields to update' })
    const info = db.prepare(`UPDATE budget_items SET ${sets.join(', ')} WHERE id = ?`).run(...vals, req.params.id)
    if (info.changes === 0) return reply.code(404).send({ error: 'not found' })
    const unlocked = evaluateAchievements(db, today())
    return { item: db.prepare('SELECT * FROM budget_items WHERE id = ?').get(req.params.id), unlocked }
  })

  app.delete<{ Params: { id: string } }>('/api/budget/:id', async (req, reply) => {
    const info = db.prepare('DELETE FROM budget_items WHERE id = ?').run(req.params.id)
    if (info.changes === 0) return reply.code(404).send({ error: 'not found' })
    return { ok: true }
  })

  // ---- Achievements & analytics ------------------------------------------

  app.get('/api/achievements', async () => {
    evaluateAchievements(db, today())
    return db.prepare('SELECT * FROM achievements ORDER BY unlocked_at IS NULL, unlocked_at DESC').all()
  })

  app.get<{ Querystring: { weeks?: number } }>('/api/analytics/volume', async (req) =>
    volumeBuckets(db, today(), Math.min(Number(req.query.weeks) || 12, 52)),
  )

  app.get('/api/analytics/load', async () => trainingLoad(db, today()))

  app.get<{ Querystring: { year?: number } }>('/api/analytics/heatmap', async (req) =>
    heatmap(db, Number(req.query.year) || new Date().getFullYear()),
  )

  app.get('/api/analytics/power-level', async () => powerLevel(db, today()))

  app.get('/api/analytics/projection', async () => raceProjection(db, today()))

  /** Shareable progress-card payload. */
  app.get('/api/analytics/card', async () => {
    const d = today()
    const pl = powerLevel(db, d)
    const vol = volumeBuckets(db, d, 4)
    const totals = db
      .prepare('SELECT COUNT(*) AS sessions, COALESCE(SUM(duration_min),0) AS minutes, COALESCE(SUM(distance_km),0) AS km FROM workouts')
      .get() as { sessions: number; minutes: number; km: number }
    return {
      title: 'VANTAGE — PROJECT IRONMIND',
      date: d,
      powerLevel: pl.score,
      fourWeekKm: Math.round(vol.reduce((s, b) => s + b.km, 0)),
      fourWeekHours: Math.round(vol.reduce((s, b) => s + b.minutes, 0) / 60),
      lifetime: { sessions: totals.sessions, hours: Math.round(totals.minutes / 60), km: Math.round(totals.km) },
    }
  })

  /** Year-in-review: merged timeline for the Life Archive. */
  app.get<{ Querystring: { year?: number } }>('/api/yearbook', async (req) => {
    const year = Number(req.query.year) || new Date().getFullYear()
    const from = `${year}-01-01`
    const to = `${year}-12-31`
    const events: Array<{ date: string; kind: string; title: string; detail?: string }> = []

    const workouts = db
      .prepare(
        `SELECT date, type, title, duration_min, distance_km, feeling FROM workouts
         WHERE date >= ? AND date <= ? ORDER BY date`,
      )
      .all(from, to) as Array<Record<string, never>>
    for (const w of workouts)
      events.push({
        date: w.date,
        kind: 'workout',
        title: (w.title as string) || `${w.type} session`,
        detail: `${Math.round(w.duration_min as number)} min${w.distance_km ? ` · ${w.distance_km} km` : ''} — "${w.feeling}"`,
      })

    const milestones = db
      .prepare('SELECT title, completed_at FROM milestones WHERE completed = 1 AND completed_at >= ? AND completed_at <= ?')
      .all(from, to) as Array<{ title: string; completed_at: string }>
    for (const m of milestones) events.push({ date: m.completed_at.slice(0, 10), kind: 'milestone', title: m.title })

    const journal = db
      .prepare('SELECT date, mood, content FROM journal_entries WHERE date >= ? AND date <= ? ORDER BY date')
      .all(from, to) as Array<{ date: string; mood: number | null; content: string }>
    for (const j of journal)
      events.push({ date: j.date, kind: 'journal', title: `Reflection${j.mood ? ` (mood ${j.mood}/10)` : ''}`, detail: j.content.slice(0, 140) })

    const books = db
      .prepare("SELECT title, finished_at, rating FROM books WHERE status = 'finished' AND finished_at >= ? AND finished_at <= ?")
      .all(from, to) as Array<{ title: string; finished_at: string; rating: number | null }>
    for (const b of books)
      events.push({ date: b.finished_at, kind: 'book', title: `Finished: ${b.title}`, detail: b.rating ? `${b.rating}/5` : undefined })

    const achievements = db
      .prepare('SELECT title, icon, unlocked_at FROM achievements WHERE unlocked_at IS NOT NULL')
      .all() as Array<{ title: string; icon: string; unlocked_at: string }>
    for (const a of achievements.filter((a) => a.unlocked_at >= from && a.unlocked_at <= `${to}T23:59:59`))
      events.push({ date: a.unlocked_at.slice(0, 10), kind: 'achievement', title: `${a.icon} ${a.title}` })

    events.sort((a, b) => (a.date < b.date ? -1 : 1))

    const stats = {
      workouts: workouts.length,
      hours: Math.round(workouts.reduce((s, w) => s + (w.duration_min as number), 0) / 60),
      km: Math.round(workouts.reduce((s, w) => s + ((w.distance_km as number) || 0), 0)),
      journalEntries: journal.length,
      booksFinished: books.length,
      milestones: milestones.length,
    }
    return { year, stats, events, heatmap: heatmap(db, year) }
  })
}
