import { describe, expect, it } from 'vitest'
import { computeRollingState, shouldReduceIntensity, shouldTriggerResetWeek } from '../recovery.ts'
import { NEUTRAL_STATE, type DailyLogInput } from '../types.ts'

const state = (over: Partial<typeof NEUTRAL_STATE>) => ({ ...NEUTRAL_STATE, ...over })

describe('reset-week trigger', () => {
  it('fires at avg fatigue 7.5, not 7.4 (boundary)', () => {
    expect(shouldTriggerResetWeek(state({ recentFatigue: 7.5 }))).toBe(true)
    expect(shouldTriggerResetWeek(state({ recentFatigue: 7.4 }))).toBe(false)
  })

  it('fires at avg mood 2.0, not 2.1; fires on 3 missed in last 5', () => {
    expect(shouldTriggerResetWeek(state({ recentMood: 2 }))).toBe(true)
    expect(shouldTriggerResetWeek(state({ recentMood: 2.1 }))).toBe(false)
    expect(shouldTriggerResetWeek(state({ missedInLastFive: 3 }))).toBe(true)
    expect(shouldTriggerResetWeek(state({ missedInLastFive: 2 }))).toBe(false)
  })
})

describe('intensity reduction', () => {
  it('uses strict comparisons: fatigue > 7, sleep < 6', () => {
    expect(shouldReduceIntensity(state({ recentFatigue: 7 }))).toBe(false)
    expect(shouldReduceIntensity(state({ recentFatigue: 7.1 }))).toBe(true)
    expect(shouldReduceIntensity(state({ recentSleepHours: 6 }))).toBe(false)
    expect(shouldReduceIntensity(state({ recentSleepHours: 5.9 }))).toBe(true)
  })
})

describe('computeRollingState', () => {
  const log = (date: string, f: number, m: number, s: number, a: number, missed = false): DailyLogInput => ({
    date,
    fatigue: f,
    mood: m,
    sleepHours: s,
    adherence: a,
    missedWorkout: missed,
  })

  it('computes exact rolling averages and consecutive missed days', () => {
    const logs = [
      log('2026-06-05', 4, 7, 8, 1),
      log('2026-06-06', 5, 6, 7, 1),
      log('2026-06-07', 6, 6, 7.5, 1),
      log('2026-06-08', 7, 5, 6.5, 0.5, true),
      log('2026-06-09', 8, 5, 6, 0, true),
      log('2026-06-10', 8, 4, 6, 0, true),
    ]
    const s = computeRollingState(logs)
    expect(s.recentFatigue).toBeCloseTo((4 + 5 + 6 + 7 + 8 + 8) / 6, 1)
    expect(s.recentMood).toBeCloseTo((7 + 6 + 6 + 5 + 5 + 4) / 6, 1)
    expect(s.consecutiveMissedDays).toBe(3)
    expect(s.missedInLastFive).toBe(3)
    expect(shouldTriggerResetWeek(s)).toBe(true) // 3 missed in last 5
  })

  it('handles sparse logs with neutral fallbacks and unsorted input', () => {
    const s = computeRollingState([log('2026-06-10', 5, 6, 7, 1), log('2026-06-08', 5, 6, 7, 1)])
    expect(s.recentFatigue).toBe(5)
    expect(s.missedInLastFive).toBe(0)
    const empty = computeRollingState([])
    expect(empty.recentSleepHours).toBe(NEUTRAL_STATE.recentSleepHours)
  })
})
