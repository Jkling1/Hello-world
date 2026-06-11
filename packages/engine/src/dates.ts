import type { ISODate, PhaseInfo, ProgramConfig } from './types.ts'
import { DEFAULT_PROGRAM_CONFIG } from './config.ts'

/** Parse 'YYYY-MM-DD' to a UTC ms timestamp — immune to container timezone. */
export function toUTC(date: ISODate): number {
  const y = Number(date.slice(0, 4))
  const m = Number(date.slice(5, 7))
  const d = Number(date.slice(8, 10))
  if (!y || !m || !d) throw new Error(`Invalid ISO date: ${date}`)
  return Date.UTC(y, m - 1, d)
}

export function toISO(utcMs: number): ISODate {
  return new Date(utcMs).toISOString().slice(0, 10)
}

/** Whole days from a to b (positive when b is after a). */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b) - toUTC(a)) / 86_400_000)
}

export function addDays(date: ISODate, days: number): ISODate {
  return toISO(toUTC(date) + days * 86_400_000)
}

/** 0 = Sunday … 6 = Saturday, computed in UTC. */
export function dayOfWeek(date: ISODate): number {
  return new Date(toUTC(date)).getUTCDay()
}

/**
 * Day number with Day 0 = program start, matching the brief's
 * "Day 257 / 341" convention (2026-08-15 → 257).
 */
export function getDayNumber(date: ISODate, config: ProgramConfig = DEFAULT_PROGRAM_CONFIG): number {
  return diffDays(config.programStart, date)
}

export function getTotalDays(config: ProgramConfig = DEFAULT_PROGRAM_CONFIG): number {
  return diffDays(config.programStart, config.raceDate)
}

export function getDaysToRace(date: ISODate, config: ProgramConfig = DEFAULT_PROGRAM_CONFIG): number {
  return diffDays(date, config.raceDate)
}

export function getWeekOfPhase(date: ISODate, config: ProgramConfig = DEFAULT_PROGRAM_CONFIG): number {
  return getPhase(date, config).weekOfPhase
}

/** Phase containing the date; clamps to first/last phase outside the program window. */
export function getPhase(date: ISODate, config: ProgramConfig = DEFAULT_PROGRAM_CONFIG): PhaseInfo {
  const t = toUTC(date)
  let def = config.phases.find((p) => t >= toUTC(p.start) && t <= toUTC(p.end))
  if (!def) def = t < toUTC(config.phases[0].start) ? config.phases[0] : config.phases[config.phases.length - 1]
  const clampedT = Math.min(Math.max(t, toUTC(def.start)), toUTC(def.end))
  const weekOfPhase = Math.floor(diffDays(def.start, toISO(clampedT)) / 7) + 1
  const totalWeeks = Math.ceil((diffDays(def.start, def.end) + 1) / 7)
  return { ...def, weekOfPhase, totalWeeks }
}

export function formatLongDate(date: ISODate): string {
  return new Date(toUTC(date)).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
