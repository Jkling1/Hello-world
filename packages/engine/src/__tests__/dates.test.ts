import { describe, expect, it } from 'vitest'
import { getDayNumber, getDaysToRace, getPhase, getTotalDays, dayOfWeek } from '../dates.ts'
import { makeProgramConfig } from '../config.ts'

describe('program dates & phases', () => {
  it('phase boundaries are exact (P0→P1 at Jan 15/16)', () => {
    expect(getPhase('2025-12-01').id).toBe('P0')
    expect(getPhase('2025-12-01').weekOfPhase).toBe(1)
    expect(getPhase('2026-01-15').id).toBe('P0')
    expect(getPhase('2026-01-16').id).toBe('P1')
    expect(getPhase('2026-04-15').id).toBe('P1')
    expect(getPhase('2026-04-16').id).toBe('P2')
    expect(getPhase('2026-07-31').id).toBe('P2')
    expect(getPhase('2026-08-01').id).toBe('P3')
    expect(getPhase('2026-10-10').id).toBe('P3')
    expect(getPhase('2026-10-11').id).toBe('P4')
  })

  it("matches the brief's sample: Aug 15 2026 = Day 257/341, 84 days to race, Race Build", () => {
    expect(getDayNumber('2026-08-15')).toBe(257)
    expect(getTotalDays()).toBe(341)
    expect(getDaysToRace('2026-08-15')).toBe(84)
    expect(getPhase('2026-08-15').id).toBe('P3')
    expect(dayOfWeek('2026-08-15')).toBe(6) // Saturday, per the sample header
  })

  it('race day is P4 with 0 days to race', () => {
    expect(getPhase('2026-11-07').id).toBe('P4')
    expect(getDaysToRace('2026-11-07')).toBe(0)
    expect(getDaysToRace('2026-11-06')).toBe(1)
  })

  it('custom ProgramConfig moves every boundary — nothing hardcoded', () => {
    const cfg = makeProgramConfig({ programStart: '2026-06-01', raceDate: '2027-05-08' })
    expect(getPhase('2026-06-01', cfg).id).toBe('P0')
    expect(getPhase('2027-05-08', cfg).id).toBe('P4')
    expect(getDaysToRace('2027-05-08', cfg)).toBe(0)
    expect(getDayNumber('2026-06-01', cfg)).toBe(0)
    // a date that is P2 in the default program is early-phase here
    expect(getPhase('2026-06-15', cfg).id).toBe('P0')
  })
})
