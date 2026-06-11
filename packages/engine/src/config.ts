import type { ProgramConfig } from './types.ts'

/**
 * The single source of truth for program dates. Everything else computes
 * phase / day number / days-to-race from this — nothing is hardcoded
 * elsewhere. Override by passing a custom ProgramConfig to any function.
 */
export const DEFAULT_PROGRAM_CONFIG: ProgramConfig = {
  programStart: '2025-12-01',
  raceDate: '2026-11-07',
  raceName: 'Ironman Florida',
  phases: [
    {
      id: 'P0',
      name: 'Foundation & Assessment',
      mission: 'Build the base habits. Assess honestly. Show up.',
      start: '2025-12-01',
      end: '2026-01-15',
    },
    {
      id: 'P1',
      name: 'Aerobic Engine & Consistency',
      mission: 'Big aerobic engine, boring on purpose. Consistency over intensity.',
      start: '2026-01-16',
      end: '2026-04-15',
    },
    {
      id: 'P2',
      name: 'Strength, Volume & Durability',
      mission: 'Get durable. Stack volume the body can absorb.',
      start: '2026-04-16',
      end: '2026-07-31',
    },
    {
      id: 'P3',
      name: 'Race-Specific Build',
      mission: "Race-specific work. Practice how you'll race.",
      start: '2026-08-01',
      end: '2026-10-10',
    },
    {
      id: 'P4',
      name: 'Taper & Mental Rehearsal',
      mission: 'Sharpen, rest, rehearse. The hay is in the barn.',
      start: '2026-10-11',
      end: '2026-11-07',
    },
  ],
}

/** Builds a phase table proportionally when race/start dates are customized. */
export function makeProgramConfig(opts: {
  programStart: string
  raceDate: string
  raceName?: string
}): ProgramConfig {
  const base = DEFAULT_PROGRAM_CONFIG
  const span = (a: string, b: string) =>
    (Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) -
      Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) /
    86_400_000
  const baseTotal = span(base.programStart, base.raceDate)
  const newTotal = span(opts.programStart, opts.raceDate)
  const startMs = Date.UTC(
    +opts.programStart.slice(0, 4),
    +opts.programStart.slice(5, 7) - 1,
    +opts.programStart.slice(8, 10),
  )
  const toISO = (ms: number) => new Date(ms).toISOString().slice(0, 10)
  const phases = base.phases.map((p, i) => {
    const startFrac = span(base.programStart, p.start) / baseTotal
    const endFrac = span(base.programStart, p.end) / baseTotal
    return {
      ...p,
      start: i === 0 ? opts.programStart : toISO(startMs + Math.round(startFrac * newTotal) * 86_400_000),
      end: i === base.phases.length - 1 ? opts.raceDate : toISO(startMs + Math.round(endFrac * newTotal) * 86_400_000),
    }
  })
  return {
    programStart: opts.programStart,
    raceDate: opts.raceDate,
    raceName: opts.raceName ?? base.raceName,
    phases,
  }
}
