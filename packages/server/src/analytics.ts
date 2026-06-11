import { addDays, dayOfWeek, getDayNumber, getTotalDays, type ISODate } from '@vantage/engine'
import type { DB } from './db.ts'
import { buildUserState, getProgramConfig } from './state.ts'
import { getStreak } from './achievements.ts'

export interface VolumeBucket {
  start: ISODate
  end: ISODate
  minutes: number
  km: number
  sessions: number
}

/** Weekly (Mon-Sun) or monthly volume buckets ending at `today`. */
export function volumeBuckets(db: DB, today: ISODate, weeks: number): VolumeBucket[] {
  // find the Monday of the current week
  const dow = dayOfWeek(today)
  const monday = addDays(today, dow === 0 ? -6 : 1 - dow)
  const buckets: VolumeBucket[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const start = addDays(monday, -7 * i)
    const end = addDays(start, 6)
    const row = db
      .prepare(
        `SELECT COALESCE(SUM(duration_min),0) AS minutes, COALESCE(SUM(distance_km),0) AS km, COUNT(*) AS sessions
         FROM workouts WHERE date >= ? AND date <= ?`,
      )
      .get(start, end) as { minutes: number; km: number; sessions: number }
    buckets.push({ start, end, minutes: Math.round(row.minutes), km: Math.round(row.km * 10) / 10, sessions: row.sessions })
  }
  return buckets
}

/** Acute (7d) vs chronic (28d) load ratio — the classic ramp-rate guard. */
export function trainingLoad(db: DB, today: ISODate) {
  const sum = (days: number) =>
    (
      db
        .prepare('SELECT COALESCE(SUM(duration_min * COALESCE(effort,5)),0) AS load FROM workouts WHERE date > ? AND date <= ?')
        .get(addDays(today, -days), today) as { load: number }
    ).load
  const acute = sum(7)
  const chronicTotal = sum(28)
  const chronicWeekly = chronicTotal / 4
  const ratio = chronicWeekly > 0 ? acute / chronicWeekly : 1
  const series: Array<{ date: ISODate; load: number }> = []
  for (let i = 41; i >= 0; i--) {
    const d = addDays(today, -i)
    const row = db
      .prepare('SELECT COALESCE(SUM(duration_min * COALESCE(effort,5)),0) AS load FROM workouts WHERE date > ? AND date <= ?')
      .get(addDays(d, -7), d) as { load: number }
    series.push({ date: d, load: Math.round(row.load) })
  }
  return { acute: Math.round(acute), chronicWeekly: Math.round(chronicWeekly), ratio: Math.round(ratio * 100) / 100, series }
}

/** Per-day activity score for the calendar heatmap (0-4). */
export function heatmap(db: DB, year: number) {
  const rows = db
    .prepare(
      `SELECT date, SUM(duration_min) AS minutes, COUNT(*) AS sessions
       FROM workouts WHERE date >= ? AND date <= ? GROUP BY date`,
    )
    .all(`${year}-01-01`, `${year}-12-31`) as Array<{ date: string; minutes: number; sessions: number }>
  return rows.map((r) => ({
    date: r.date,
    minutes: Math.round(r.minutes),
    sessions: r.sessions,
    level: r.minutes >= 150 ? 4 : r.minutes >= 90 ? 3 : r.minutes >= 45 ? 2 : 1,
  }))
}

/** Composite 0-100: training progress + consistency + readiness + funding. */
export function powerLevel(db: DB, today: ISODate) {
  const config = getProgramConfig(db)
  const programProgress = Math.min(Math.max(getDayNumber(today, config) / getTotalDays(config), 0), 1)

  const streak = getStreak(db, today)
  const streakScore = Math.min(streak / 30, 1)

  const state = buildUserState(db, today)
  const adherenceScore = state.recentAdherence
  const freshness = 1 - Math.min(Math.max((state.recentFatigue - 3) / 7, 0), 1) * 0.5

  const budget = db
    .prepare('SELECT COALESCE(SUM(planned_cents),0) AS p, COALESCE(SUM(spent_cents),0) AS s FROM budget_items')
    .get() as { p: number; s: number }
  const budgetScore = budget.p > 0 ? Math.min(budget.s / budget.p, 1) : 0

  const ms = db.prepare('SELECT COUNT(*) AS total, COALESCE(SUM(completed),0) AS done FROM milestones').get() as {
    total: number
    done: number
  }
  const milestoneScore = ms.total > 0 ? ms.done / ms.total : 0

  const score =
    100 *
    (0.3 * programProgress + 0.2 * streakScore + 0.2 * adherenceScore * freshness + 0.15 * milestoneScore + 0.15 * budgetScore)

  return {
    score: Math.round(score),
    components: {
      programProgress: Math.round(programProgress * 100),
      streak: Math.round(streakScore * 100),
      consistency: Math.round(adherenceScore * freshness * 100),
      milestones: Math.round(milestoneScore * 100),
      funding: Math.round(budgetScore * 100),
    },
  }
}

/** Naive race projection from recent long-session paces, with honest caveats. */
export function raceProjection(db: DB, today: ISODate) {
  const since = addDays(today, -56)
  const pace = (type: string) =>
    db
      .prepare(
        `SELECT SUM(duration_min) AS mins, SUM(distance_km) AS km FROM workouts
         WHERE type = ? AND date > ? AND distance_km > 0`,
      )
      .get(type, since) as { mins: number | null; km: number | null }

  const swim = pace('swim')
  const bike = pace('bike')
  const run = pace('run')

  const project = (p: { mins: number | null; km: number | null }, raceKm: number, enduranceFactor: number) => {
    if (!p.mins || !p.km || p.km <= 0) return null
    const minPerKm = p.mins / p.km
    return Math.round(minPerKm * raceKm * enduranceFactor)
  }
  // Ironman distances: 3.86 km swim, 180.2 km bike, 42.2 km run; factors pad training pace → race-day reality.
  const swimMin = project(swim, 3.86, 1.05)
  const bikeMin = project(bike, 180.2, 1.1)
  const runMin = project(run, 42.2, 1.18)
  const transitions = 12
  const total = swimMin && bikeMin && runMin ? swimMin + bikeMin + runMin + transitions : null
  return {
    swimMin,
    bikeMin,
    runMin,
    transitionsMin: transitions,
    totalMin: total,
    note: total
      ? 'Projected from last 8 weeks of logged paces with endurance padding. The race will have its own opinion.'
      : 'Not enough recent distance data per discipline to project yet — log swims, rides and runs with distance.',
  }
}
