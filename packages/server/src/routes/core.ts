import type { FastifyInstance } from 'fastify'
import {
  generateDailyProtocol,
  getDayNumber,
  getDaysToRace,
  getPhase,
  getTotalDays,
  addDays,
} from '@vantage/engine'
import type { DB } from '../db.ts'
import { buildUserState, getProfile, getProgramConfig, getSetting, setSetting, today } from '../state.ts'
import { getStreak } from '../achievements.ts'
import { getProviderInfo } from '../coach/provider.ts'

export function registerCoreRoutes(app: FastifyInstance, db: DB): void {
  app.get('/api/health', async () => {
    db.prepare('SELECT 1').get()
    return { ok: true, db: 'up', coach: getProviderInfo(), date: today() }
  })

  app.get('/api/profile', async () => {
    const p = getProfile(db)
    return { ...p, injuries: JSON.parse(getSetting(db, 'current_injuries') ?? '[]') }
  })

  app.patch<{ Body: Record<string, unknown> }>(
    '/api/profile',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            location: { type: 'string' },
            race_name: { type: 'string' },
            race_date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            program_start: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            persona_notes: { type: 'string' },
            injuries: { type: 'array' },
          },
          additionalProperties: false,
        },
      },
    },
    async (req) => {
      const body = req.body
      const allowed = ['name', 'email', 'location', 'race_name', 'race_date', 'program_start', 'persona_notes']
      for (const key of allowed) {
        if (body[key] !== undefined) {
          db.prepare(`UPDATE profile SET ${key} = ? WHERE id = 1`).run(body[key])
        }
      }
      if (body.injuries !== undefined) setSetting(db, 'current_injuries', JSON.stringify(body.injuries))
      return getProfile(db)
    },
  )

  app.get('/api/settings', async () => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  })

  app.patch<{ Body: Record<string, string> }>('/api/settings', async (req) => {
    for (const [k, v] of Object.entries(req.body ?? {})) setSetting(db, k, String(v))
    return { ok: true }
  })

  /** Everything Mission Control needs in one round-trip. */
  app.get('/api/dashboard', async () => {
    const date = today()
    const config = getProgramConfig(db)
    const state = buildUserState(db, date)
    const protocol = generateDailyProtocol(date, state, config)

    const tasks = db
      .prepare('SELECT COUNT(*) AS total, COALESCE(SUM(completed),0) AS done FROM tasks WHERE date = ?')
      .get(date) as { total: number; done: number }

    const weekVol = db
      .prepare(
        'SELECT COALESCE(SUM(duration_min),0) AS minutes, COALESCE(SUM(distance_km),0) AS km, COUNT(*) AS sessions FROM workouts WHERE date > ? AND date <= ?',
      )
      .get(addDays(date, -7), date) as { minutes: number; km: number; sessions: number }

    const activeBooks = db.prepare("SELECT COUNT(*) AS n FROM books WHERE status = 'active'").get() as { n: number }

    return {
      date,
      name: getProfile(db).name,
      raceName: config.raceName,
      raceDate: config.raceDate,
      dayNumber: getDayNumber(date, config),
      totalDays: getTotalDays(config),
      daysToRace: getDaysToRace(date, config),
      phase: getPhase(date, config),
      streak: getStreak(db, date),
      tasksDone: tasks.done,
      tasksTotal: tasks.total,
      activeBooks: activeBooks.n,
      weekVolume: { minutes: Math.round(weekVol.minutes), km: Math.round(weekVol.km * 10) / 10, sessions: weekVol.sessions },
      userState: state,
      protocol,
      seeded: getSetting(db, 'seed_version') !== null,
    }
  })
}
