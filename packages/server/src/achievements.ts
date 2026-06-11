import type { DB } from './db.ts'
import { addDays, type ISODate } from '@vantage/engine'

export interface Achievement {
  id: number
  code: string
  title: string
  description: string | null
  icon: string
  unlocked_at: string | null
}

/** A day counts toward the streak if a workout was logged, or it's a logged non-missed day (rest counts when honored). */
function dayCounts(db: DB, date: ISODate): boolean {
  const w = db.prepare('SELECT 1 FROM workouts WHERE date = ? LIMIT 1').get(date)
  if (w) return true
  const log = db.prepare('SELECT missed_workout FROM daily_logs WHERE date = ?').get(date) as
    | { missed_workout: number }
    | undefined
  return log !== undefined && log.missed_workout === 0
}

export function getStreak(db: DB, today: ISODate): number {
  let streak = 0
  // Today not yet logged shouldn't break the streak — start from today if it counts, else yesterday.
  let cursor = dayCounts(db, today) ? today : addDays(today, -1)
  while (dayCounts(db, cursor)) {
    streak++
    cursor = addDays(cursor, -1)
    if (streak > 1000) break
  }
  return streak
}

export function getJournalStreak(db: DB, today: ISODate): number {
  const has = (d: ISODate) => !!db.prepare('SELECT 1 FROM journal_entries WHERE date = ? LIMIT 1').get(d)
  let streak = 0
  let cursor = has(today) ? today : addDays(today, -1)
  while (has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
    if (streak > 1000) break
  }
  return streak
}

function weekDistanceKm(db: DB, today: ISODate): number {
  const row = db
    .prepare('SELECT COALESCE(SUM(distance_km),0) AS km FROM workouts WHERE date > ? AND date <= ?')
    .get(addDays(today, -7), today) as { km: number }
  return row.km
}

/**
 * Evaluates every unlock condition against current data; unlocks anything
 * newly earned. Returns the achievements unlocked in this pass so the UI
 * can celebrate them.
 */
export function evaluateAchievements(db: DB, today: ISODate): Achievement[] {
  const conditions: Record<string, () => boolean> = {
    first_workout: () => !!db.prepare('SELECT 1 FROM workouts LIMIT 1').get(),
    streak_7: () => getStreak(db, today) >= 7,
    streak_30: () => getStreak(db, today) >= 30,
    week_100km: () => weekDistanceKm(db, today) >= 100,
    first_brick: () => !!db.prepare("SELECT 1 FROM workouts WHERE type = 'brick' LIMIT 1").get(),
    first_book_note: () => !!db.prepare('SELECT 1 FROM book_notes LIMIT 1').get(),
    book_finished: () => !!db.prepare("SELECT 1 FROM books WHERE status = 'finished' LIMIT 1").get(),
    journal_streak_7: () => getJournalStreak(db, today) >= 7,
    century_ride: () => !!db.prepare("SELECT 1 FROM workouts WHERE type = 'bike' AND distance_km >= 180 LIMIT 1").get(),
    budget_funded: () => {
      const r = db
        .prepare('SELECT COALESCE(SUM(planned_cents),0) AS p, COALESCE(SUM(spent_cents),0) AS s FROM budget_items')
        .get() as { p: number; s: number }
      return r.p > 0 && r.s >= r.p
    },
    race_ready: () => {
      const r = db
        .prepare('SELECT COUNT(*) AS total, SUM(completed) AS done FROM milestones')
        .get() as { total: number; done: number | null }
      return r.total > 0 && r.done === r.total
    },
  }

  const unlock = db.prepare(
    "UPDATE achievements SET unlocked_at = datetime('now') WHERE code = ? AND unlocked_at IS NULL",
  )
  const fresh: Achievement[] = []
  for (const [code, check] of Object.entries(conditions)) {
    try {
      if (check() && unlock.run(code).changes > 0) {
        fresh.push(db.prepare('SELECT * FROM achievements WHERE code = ?').get(code) as Achievement)
      }
    } catch {
      // a single bad condition never blocks the rest
    }
  }
  return fresh
}
