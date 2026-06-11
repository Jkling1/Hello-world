import { describe, expect, it } from 'vitest'
import { generateDailyProtocol, generateWeek } from '../engine.ts'
import { getDurationScale, getWeeklyTemplate, applyInjurySwaps, buildBlocks } from '../training.ts'
import { getBigRocks, getLifeSystemsForDate } from '../lifeSystems.ts'
import { getMindsetBlock } from '../mindset.ts'
import { getNutritionBlock } from '../nutrition.ts'
import { getPhase } from '../dates.ts'
import { formatProtocolMarkdown } from '../format.ts'
import { NEUTRAL_STATE, type UserState } from '../types.ts'

const state = (over: Partial<UserState> = {}): UserState => ({ ...NEUTRAL_STATE, ...over })

describe('duration scaling', () => {
  it('taper bottoms at 0.6×, peak build hits 1.15×, all within clamp', () => {
    const lastP4 = getPhase('2026-11-07')
    expect(getDurationScale(lastP4)).toBe(0.6)
    const midP3 = getPhase('2026-09-05')
    expect(getDurationScale(midP3)).toBe(1.15)
    for (const d of ['2025-12-03', '2026-02-10', '2026-06-11', '2026-08-15', '2026-10-20']) {
      const s = getDurationScale(getPhase(d))
      expect(s).toBeGreaterThanOrEqual(0.6)
      expect(s).toBeLessThanOrEqual(1.15)
    }
  })

  it('eases in at the start of a phase (week 1 < mid-phase)', () => {
    expect(getDurationScale(getPhase('2026-04-16'))).toBeLessThan(getDurationScale(getPhase('2026-06-11')))
  })
})

describe('adaptive protocol generation', () => {
  it('high fatigue reduces intensity and duration, sets flag', () => {
    const neutral = generateDailyProtocol('2026-06-09', state()) // Tuesday run, P2
    const tired = generateDailyProtocol('2026-06-09', state({ recentFatigue: 7.4, recentSleepHours: 5 }))
    expect(tired.flags).toContain('intensity_reduced')
    const nRun = neutral.workouts.find((w) => w.primary)!
    const tRun = tired.workouts.find((w) => w.primary)!
    expect(tRun.durationRange[1]).toBeLessThan(nRun.durationRange[1])
    expect(tRun.intensity).not.toBe(nRun.intensity)
    expect(tRun.modifications.length).toBeGreaterThan(0)
  })

  it('deload week compresses weekly volume to ≤ ~65% of neutral', () => {
    const sum = (days: ReturnType<typeof generateWeek>) =>
      days.flatMap((d) => d.workouts.filter((w) => !w.optional)).reduce((s, w) => s + w.durationRange[1], 0)
    const normal = generateWeek('2026-06-08', state())
    const deload = generateWeek('2026-06-08', state({ recentFatigue: 8 }))
    expect(deload.every((d) => d.isDeloadWeek)).toBe(true)
    expect(deload[0].flags).toContain('deload')
    expect(sum(deload)).toBeLessThanOrEqual(sum(normal) * 0.65)
  })

  it('race week sets the race_week flag and visualization mindset', () => {
    const p = generateDailyProtocol('2026-11-03', state())
    expect(p.flags).toContain('race_week')
    expect(p.mindset.triggeredBy).toBe('race_week')
    expect(p.mindset.kind).toBe('visualization')
  })
})

describe('injury swaps', () => {
  it('knee injury removes all running, swaps in non-impact work', () => {
    const p = generateDailyProtocol('2026-06-09', state({ currentInjuries: [{ area: 'knee', severity: 2 }] })) // Tue run
    expect(p.workouts.some((w) => w.discipline === 'run')).toBe(false)
    expect(p.workouts.length).toBeGreaterThan(0)
    expect(p.flags).toContain('injury_modified')
    expect(p.workouts[0].modifications.join(' ')).toMatch(/knee/i)
  })

  it('brick keeps the bike leg only with a knee injury', () => {
    const phase = getPhase('2026-08-15') // P3 Saturday = brick
    const blocks = buildBlocks(getWeeklyTemplate('P3')[6].sessions, 1)
    const swapped = applyInjurySwaps(blocks, [{ area: 'knee', severity: 2 }])
    expect(swapped.some((w) => w.discipline === 'brick')).toBe(false)
    expect(swapped.some((w) => w.discipline === 'bike')).toBe(true)
    expect(phase.id).toBe('P3')
  })

  it('shoulder injury removes swimming', () => {
    const p = generateDailyProtocol('2026-06-10', state({ currentInjuries: [{ area: 'shoulder', severity: 2 }] })) // Wed swim
    expect(p.workouts.some((w) => w.discipline === 'swim')).toBe(false)
  })
})

describe('weekly structure & life systems', () => {
  it('honors the canonical week: Mon rest+money, Tue run, Sat long/brick+reset, Sun bike+planning', () => {
    const mon = generateDailyProtocol('2026-06-08', state())
    expect(mon.workouts.find((w) => w.primary)!.discipline).toBe('rest')
    expect(mon.lifeSystems.map((s) => s.title).join()).toMatch(/Money Review/)
    const tue = generateDailyProtocol('2026-06-09', state())
    expect(tue.workouts.find((w) => w.primary)!.discipline).toBe('run')
    const sat = generateDailyProtocol('2026-06-13', state())
    expect(['run', 'brick']).toContain(sat.workouts.find((w) => w.primary)!.discipline)
    expect(sat.lifeSystems.map((s) => s.title).join()).toMatch(/Environment Reset/)
    const sun = generateDailyProtocol('2026-06-14', state())
    expect(sun.workouts.find((w) => w.primary)!.discipline).toBe('bike')
    expect(sun.lifeSystems.map((s) => s.title).join()).toMatch(/Planning/)
    expect(getLifeSystemsForDate('2026-06-09')).toHaveLength(0)
  })

  it('never exceeds 3 big rocks even when conditions add candidates', () => {
    const overloaded = state({ recentAdherence: 0.4, consecutiveMissedDays: 3, activeDeloadWeek: false })
    for (const d of ['2026-06-08', '2026-06-13', '2026-08-15']) {
      expect(getBigRocks(d, getPhase(d), overloaded).length).toBeLessThanOrEqual(3)
      expect(generateDailyProtocol(d, overloaded).bigRocks.length).toBeLessThanOrEqual(3)
    }
  })
})

describe('mindset overrides', () => {
  it('condition triggers override the default rotation', () => {
    expect(getMindsetBlock('2026-06-11', getPhase('2026-06-11'), state({ recentFatigue: 8 })).triggeredBy).toBe('high_fatigue')
    expect(getMindsetBlock('2026-06-11', getPhase('2026-06-11'), state({ recentMood: 3 })).triggeredBy).toBe('low_mood')
    expect(getMindsetBlock('2026-06-11', getPhase('2026-06-11'), state({ recentAdherence: 0.5 })).triggeredBy).toBe('low_adherence')
    expect(getMindsetBlock('2026-06-11', getPhase('2026-06-11'), state()).triggeredBy).toBeNull()
  })
})

describe('nutrition scaling', () => {
  it('short easy day gets no fueling windows; long P2 ride gets pre/during/post; P3 adds race practice', () => {
    const p2 = getPhase('2026-06-14') // Sunday long ride P2
    const longRide = buildBlocks(getWeeklyTemplate('P2')[0].sessions, 1)
    const n2 = getNutritionBlock(longRide, p2)
    expect(n2.guidance.join(' ')).toMatch(/During: 60-90g/)
    expect(n2.raceFuelPractice).toBe(false)

    const p3 = getPhase('2026-08-15')
    const brick = buildBlocks(getWeeklyTemplate('P3')[6].sessions, 1.15)
    const n3 = getNutritionBlock(brick, p3)
    expect(n3.raceFuelPractice).toBe(true)
    expect(n3.guidance.join(' ')).toMatch(/RACE FUELING PRACTICE/)

    const shortDay = buildBlocks(getWeeklyTemplate('P1')[5].sessions, 0.95)
    expect(getNutritionBlock(shortDay, getPhase('2026-02-13')).raceFuelPractice).toBe(false)
  })
})

describe('markdown output', () => {
  it('renders the brief-style header for the sample date', () => {
    const md = formatProtocolMarkdown(generateDailyProtocol('2026-08-15', state()))
    expect(md).toContain('# Saturday, August 15, 2026')
    expect(md).toContain('Day 257 / 341')
    expect(md).toContain('84 days to Ironman Florida')
    expect(md).toContain('Brick Session (Bike + Run)')
    expect(md).toContain("## Today's Mission")
  })
})
