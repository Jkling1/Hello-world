import type { DailyLogInput, UserState } from './types.ts'
import { NEUTRAL_STATE } from './types.ts'

/**
 * Reset/deload week fires when ANY of:
 *  - 3+ missed days in the last 5
 *  - average fatigue >= 7.5
 *  - average mood <= 2
 */
export function shouldTriggerResetWeek(state: UserState): boolean {
  return state.missedInLastFive >= 3 || state.recentFatigue >= 7.5 || state.recentMood <= 2
}

/** Intensity comes down when fatigue > 7 OR sleep < 6 (strict comparisons per spec). */
export function shouldReduceIntensity(state: UserState): boolean {
  return state.recentFatigue > 7 || state.recentSleepHours < 6
}

/**
 * Pure rolling-state computation from raw daily logs (most recent last).
 * Averages use the trailing `windowDays` entries; missing values fall back
 * to neutral so a sparse log history never poisons the averages.
 */
export function computeRollingState(
  logs: DailyLogInput[],
  opts: { windowDays?: number; currentInjuries?: UserState['currentInjuries']; activeDeloadWeek?: boolean } = {},
): UserState {
  const windowDays = opts.windowDays ?? 7
  const sorted = [...logs].sort((a, b) => (a.date < b.date ? -1 : 1))
  const window = sorted.slice(-windowDays)

  const avg = (pick: (l: DailyLogInput) => number | null, fallback: number) => {
    const vals = window.map(pick).filter((v): v is number => v !== null && Number.isFinite(v))
    if (vals.length === 0) return fallback
    return vals.reduce((s, v) => s + v, 0) / vals.length
  }

  let consecutiveMissedDays = 0
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].missedWorkout) consecutiveMissedDays++
    else break
  }
  const missedInLastFive = sorted.slice(-5).filter((l) => l.missedWorkout).length

  return {
    recentFatigue: round1(avg((l) => l.fatigue, NEUTRAL_STATE.recentFatigue)),
    recentMood: round1(avg((l) => l.mood, NEUTRAL_STATE.recentMood)),
    recentSleepHours: round1(avg((l) => l.sleepHours, NEUTRAL_STATE.recentSleepHours)),
    recentAdherence: round2(avg((l) => l.adherence, NEUTRAL_STATE.recentAdherence)),
    currentInjuries: opts.currentInjuries ?? [],
    activeDeloadWeek: opts.activeDeloadWeek ?? false,
    consecutiveMissedDays,
    missedInLastFive,
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10
const round2 = (n: number) => Math.round(n * 100) / 100
