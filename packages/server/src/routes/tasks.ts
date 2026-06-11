import type { FastifyInstance } from 'fastify'
import { generateDailyProtocol } from '@vantage/engine'
import type { DB } from '../db.ts'
import { buildUserState, getProgramConfig, today } from '../state.ts'

const MAX_BIG_ROCKS = 3

export function registerTaskRoutes(app: FastifyInstance, db: DB): void {
  app.get<{ Querystring: { date?: string; from?: string; to?: string; cadence?: string } }>(
    '/api/tasks',
    async (req) => {
      if (req.query.from || req.query.to) {
        return db
          .prepare('SELECT * FROM tasks WHERE date >= ? AND date <= ? ORDER BY date, big_rock DESC, id')
          .all(req.query.from ?? '0000', req.query.to ?? '9999')
      }
      const date = req.query.date ?? today()
      return req.query.cadence
        ? db.prepare('SELECT * FROM tasks WHERE date = ? AND cadence = ? ORDER BY big_rock DESC, id').all(date, req.query.cadence)
        : db.prepare('SELECT * FROM tasks WHERE date = ? ORDER BY big_rock DESC, id').all(date)
    },
  )

  app.post<{ Body: Record<string, unknown> }>(
    '/api/tasks',
    {
      schema: {
        body: {
          type: 'object',
          required: ['title'],
          properties: {
            date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            title: { type: 'string', minLength: 1 },
            category: { type: 'string', enum: ['Fitness', 'Mindset', 'Knowledge', 'Social', 'Business', 'Money'] },
            cadence: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'] },
            bigRock: { type: 'boolean' },
            origin: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const b = req.body as Record<string, never>
      const date = (b.date as string) ?? today()
      if (b.bigRock) {
        const count = db.prepare('SELECT COUNT(*) AS n FROM tasks WHERE date = ? AND big_rock = 1').get(date) as {
          n: number
        }
        if (count.n >= MAX_BIG_ROCKS) {
          return reply.code(409).send({
            error: 'big_rock_cap',
            message: `Max ${MAX_BIG_ROCKS} Big Rocks per day — finish or demote one first. That's the system protecting you.`,
          })
        }
      }
      const info = db
        .prepare(
          `INSERT INTO tasks (date, title, category, cadence, big_rock, origin)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(date, b.title, b.category ?? 'Fitness', b.cadence ?? 'daily', b.bigRock ? 1 : 0, b.origin ?? 'manual')
      reply.code(201)
      return db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid)
    },
  )

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>('/api/tasks/:id', async (req, reply) => {
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as
      | { id: number; date: string; big_rock: number }
      | undefined
    if (!existing) return reply.code(404).send({ error: 'not found' })
    const b = req.body as Record<string, never>

    if (b.bigRock === true && existing.big_rock === 0) {
      const count = db
        .prepare('SELECT COUNT(*) AS n FROM tasks WHERE date = ? AND big_rock = 1 AND id != ?')
        .get(existing.date, existing.id) as { n: number }
      if (count.n >= MAX_BIG_ROCKS)
        return reply.code(409).send({ error: 'big_rock_cap', message: `Max ${MAX_BIG_ROCKS} Big Rocks per day.` })
    }

    const map: Record<string, string> = { title: 'title', category: 'category', cadence: 'cadence', date: 'date' }
    const sets: string[] = []
    const vals: unknown[] = []
    for (const [k, col] of Object.entries(map)) {
      if (b[k] !== undefined) {
        sets.push(`${col} = ?`)
        vals.push(b[k])
      }
    }
    if (b.bigRock !== undefined) {
      sets.push('big_rock = ?')
      vals.push(b.bigRock ? 1 : 0)
    }
    if (b.completed !== undefined) {
      sets.push('completed = ?', 'completed_at = ?')
      vals.push(b.completed ? 1 : 0, b.completed ? new Date().toISOString() : null)
    }
    if (sets.length === 0) return reply.code(400).send({ error: 'no fields to update' })
    db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...vals, req.params.id)
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
  })

  app.delete<{ Params: { id: string } }>('/api/tasks/:id', async (req, reply) => {
    const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id)
    if (info.changes === 0) return reply.code(404).send({ error: 'not found' })
    return { ok: true }
  })

  /**
   * Idempotently instantiates the day's auto-generated tasks: engine Big
   * Rocks + fixed-day Life Systems. Manual tasks are untouched.
   */
  app.post<{ Querystring: { date?: string } }>('/api/tasks/materialize', async (req) => {
    const date = req.query.date ?? today()
    const config = getProgramConfig(db)
    const protocol = generateDailyProtocol(date, buildUserState(db, date), config)

    const exists = db.prepare('SELECT 1 FROM tasks WHERE date = ? AND title = ? LIMIT 1')
    const insert = db.prepare(
      `INSERT INTO tasks (date, title, category, cadence, big_rock, origin, life_system_id, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'generated')`,
    )
    let created = 0

    const bigRockCount = () =>
      (db.prepare('SELECT COUNT(*) AS n FROM tasks WHERE date = ? AND big_rock = 1').get(date) as { n: number }).n
    for (const rock of protocol.bigRocks) {
      if (!exists.get(date, rock.title) && bigRockCount() < MAX_BIG_ROCKS) {
        insert.run(date, rock.title, rock.category, rock.cadence, 1, 'generated', null)
        created++
      }
    }
    const systems = db
      .prepare('SELECT * FROM life_systems WHERE active = 1 AND day_of_week = ?')
      .all(new Date(`${date}T00:00:00Z`).getUTCDay()) as Array<{ id: number; name: string; category: string }>
    for (const s of systems) {
      if (!exists.get(date, s.name)) {
        insert.run(date, s.name, s.category, 'weekly', 0, 'recurring', s.id)
        created++
      }
    }
    return { created, tasks: db.prepare('SELECT * FROM tasks WHERE date = ? ORDER BY big_rock DESC, id').all(date) }
  })

  // ---- Life systems ------------------------------------------------------

  app.get('/api/life-systems', async () => db.prepare('SELECT * FROM life_systems ORDER BY day_of_week').all())

  app.post<{ Body: Record<string, unknown> }>(
    '/api/life-systems',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1 },
            dayOfWeek: { type: ['integer', 'null'], minimum: 0, maximum: 6 },
            cadence: { type: 'string' },
            category: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const b = req.body as Record<string, never>
      const info = db
        .prepare('INSERT INTO life_systems (name, day_of_week, cadence, category) VALUES (?, ?, ?, ?)')
        .run(b.name, b.dayOfWeek ?? null, b.cadence ?? 'weekly', b.category ?? 'Business')
      reply.code(201)
      return db.prepare('SELECT * FROM life_systems WHERE id = ?').get(info.lastInsertRowid)
    },
  )

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>('/api/life-systems/:id', async (req, reply) => {
    const b = req.body as Record<string, never>
    const map: Record<string, string> = { name: 'name', dayOfWeek: 'day_of_week', cadence: 'cadence', category: 'category', active: 'active' }
    const sets: string[] = []
    const vals: unknown[] = []
    for (const [k, col] of Object.entries(map)) {
      if (b[k] !== undefined) {
        sets.push(`${col} = ?`)
        vals.push(typeof b[k] === 'boolean' ? (b[k] ? 1 : 0) : b[k])
      }
    }
    if (sets.length === 0) return reply.code(400).send({ error: 'no fields to update' })
    const info = db.prepare(`UPDATE life_systems SET ${sets.join(', ')} WHERE id = ?`).run(...vals, req.params.id)
    if (info.changes === 0) return reply.code(404).send({ error: 'not found' })
    return db.prepare('SELECT * FROM life_systems WHERE id = ?').get(req.params.id)
  })

  app.delete<{ Params: { id: string } }>('/api/life-systems/:id', async (req, reply) => {
    const info = db.prepare('DELETE FROM life_systems WHERE id = ?').run(req.params.id)
    if (info.changes === 0) return reply.code(404).send({ error: 'not found' })
    return { ok: true }
  })
}
