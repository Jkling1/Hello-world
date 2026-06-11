import {
  computeRollingState,
  makeProgramConfig,
  DEFAULT_PROGRAM_CONFIG,
  addDays,
  type DailyLogInput,
  type ISODate,
  type ProgramConfig,
  type UserState,
  type Injury,
} from '@vantage/engine'
import type { DB } from './db.ts'

export function today(): ISODate {
  return new Date().toISOString().slice(0, 10)
}

export function getSetting(db: DB, key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(db: DB, key: string, value: string): void {
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  ).run(key, value)
}

export interface ProfileRow {
  id: number
  name: string
  email: string | null
  location: string | null
  race_name: string
  race_date: string
  program_start: string
  persona_notes: string | null
}

export function getProfile(db: DB): ProfileRow {
  return db.prepare('SELECT * FROM profile WHERE id = 1').get() as ProfileRow
}

/** Program config derived from the profile's configurable dates. */
export function getProgramConfig(db: DB): ProgramConfig {
  const p = getProfile(db)
  if (p.race_date === DEFAULT_PROGRAM_CONFIG.raceDate && p.program_start === DEFAULT_PROGRAM_CONFIG.programStart) {
    return { ...DEFAULT_PROGRAM_CONFIG, raceName: p.race_name }
  }
  return makeProgramConfig({ programStart: p.program_start, raceDate: p.race_date, raceName: p.race_name })
}

function parseInjuries(raw: string | null): Injury[] {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((i) => i && typeof i.area === 'string') : []
  } catch {
    return []
  }
}

export function getInjuries(db: DB): Injury[] {
  return parseInjuries(getSetting(db, 'current_injuries'))
}

/**
 * Builds the engine UserState for a date from real logs.
 * "Missed" days are explicit daily_log flags OR scheduled days with
 * no logged workout and no log entry at all are left neutral.
 */
export function buildUserState(db: DB, date: ISODate, windowDays = 7): UserState {
  const from = addDays(date, -(windowDays + 3))
  const rows = db
    .prepare(
      `SELECT date, fatigue, mood, sleep_hours, adherence, missed_workout
       FROM daily_logs WHERE date > ? AND date <= ? ORDER BY date ASC`,
    )
    .all(from, date) as Array<{
    date: string
    fatigue: number | null
    mood: number | null
    sleep_hours: number | null
    adherence: number | null
    missed_workout: number
  }>

  const logs: DailyLogInput[] = rows.map((r) => ({
    date: r.date,
    fatigue: r.fatigue,
    mood: r.mood,
    sleepHours: r.sleep_hours,
    adherence: r.adherence,
    missedWorkout: r.missed_workout === 1,
  }))

  return computeRollingState(logs, {
    windowDays,
    currentInjuries: getInjuries(db),
    activeDeloadWeek: getSetting(db, 'active_deload_week') === '1',
  })
}
