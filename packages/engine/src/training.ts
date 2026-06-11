import type {
  Discipline,
  Injury,
  Intensity,
  PhaseId,
  PhaseInfo,
  ProtocolFlag,
  UserState,
  WorkoutBlock,
} from './types.ts'
import { shouldReduceIntensity } from './recovery.ts'

export interface SessionSpec {
  discipline: Discipline
  title: string
  /** unscaled [low, high] minutes */
  baseDuration: [number, number]
  intensity: Intensity
  effort: string
  focus: string[]
  structure: string[]
  primary?: boolean
  optional?: boolean
}

export interface DayTemplate {
  focus: string
  sessions: SessionSpec[]
}

/** index 0 = Sunday … 6 = Saturday */
export type WeekTemplate = DayTemplate[]

const S = (s: SessionSpec): SessionSpec => s

const easySpin = S({
  discipline: 'bike',
  title: 'Recovery Spin',
  baseDuration: [30, 45],
  intensity: 'recovery',
  effort: 'Zone 1 — conversational, legs only',
  focus: ['Flush the legs', 'High cadence, zero strain'],
  structure: ['Easy spin, cadence 90+', 'No hills, no heroics'],
  optional: true,
})

const mobility = S({
  discipline: 'mobility',
  title: 'Mobility & Core',
  baseDuration: [15, 25],
  intensity: 'recovery',
  effort: 'Restorative',
  focus: ['Hips, ankles, t-spine', 'Dead bugs and planks'],
  structure: ['10 min mobility flow', '10 min core circuit'],
  optional: true,
})

/**
 * Default weekly structure (Mon rest+money, Tue run, Wed swim, Thu strength/bike,
 * Fri easy, Sat long run/brick, Sun long bike), with per-phase overrides.
 */
export function getWeeklyTemplate(phase: PhaseId): WeekTemplate {
  const longRunTitle: Record<PhaseId, string> = {
    P0: 'Long Easy Run',
    P1: 'Aerobic Long Run',
    P2: 'Long Run (durability)',
    P3: 'Brick Session (Bike + Run)',
    P4: 'Race-Pace Rehearsal Run (short)',
  }
  const base: WeekTemplate = [
    // Sunday — long bike + weekly planning
    {
      focus: 'Long bike + Weekly Planning',
      sessions: [
        S({
          discipline: 'bike',
          title: 'Long Aerobic Ride',
          baseDuration: [90, 180],
          intensity: 'easy',
          effort: 'Zone 2 — steady, nasally breathable',
          focus: ['Aero position time on Nighthawk', 'Steady fueling rhythm', 'Patience'],
          structure: ['Settle in for the first 20 min', 'Main: steady Z2', 'Last 10 min easy spin down'],
          primary: true,
        }),
      ],
    },
    // Monday — rest
    {
      focus: 'Rest + Weekly Money Review',
      sessions: [
        S({
          discipline: 'rest',
          title: 'Full Rest Day',
          baseDuration: [0, 0],
          intensity: 'recovery',
          effort: 'Off. Recovery is training.',
          focus: ['Sleep is the workout', 'Walk the dog, nothing more'],
          structure: ['No structured training', 'Optional 20-min walk'],
          primary: true,
        }),
        mobility,
      ],
    },
    // Tuesday — run focus
    {
      focus: 'Run focus',
      sessions: [
        S({
          discipline: 'run',
          title: 'Run — Quality Session',
          baseDuration: [40, 60],
          intensity: 'moderate',
          effort: 'Z2 base with controlled pickups',
          focus: ['Cadence 175+', 'Tall posture late in the run'],
          structure: ['10 min easy warm-up', 'Main set per phase', '10 min cool-down'],
          primary: true,
        }),
      ],
    },
    // Wednesday — swim focus
    {
      focus: 'Swim focus',
      sessions: [
        S({
          discipline: 'swim',
          title: 'Swim — Technique + Endurance',
          baseDuration: [40, 60],
          intensity: 'moderate',
          effort: 'Smooth and long — count strokes',
          focus: ['Long exhale, relaxed catch', 'Bilateral breathing'],
          structure: ['400 warm-up mixed', 'Main: 6–10 × 200 steady', '200 easy choice'],
          primary: true,
        }),
        easySpin,
      ],
    },
    // Thursday — strength or bike
    {
      focus: 'Strength or Bike',
      sessions: [
        S({
          discipline: 'strength',
          title: 'Strength — Posterior Chain',
          baseDuration: [40, 55],
          intensity: 'moderate',
          effort: 'Heavy enough to matter, crisp reps',
          focus: ['Hinge and single-leg work', 'Core under fatigue'],
          structure: ['RDLs / split squats / rows 3×6-8', 'Calf + tib raises', 'Anti-rotation core'],
          primary: true,
        }),
        S({
          discipline: 'bike',
          title: 'Bike — Tempo Option',
          baseDuration: [45, 70],
          intensity: 'moderate',
          effort: 'Z2-Z3, smooth power',
          focus: ['Cadence discipline'],
          structure: ['3 × 10 min tempo, 5 min easy between'],
          optional: true,
        }),
      ],
    },
    // Friday — easy + prep
    {
      focus: 'Easy day + prep',
      sessions: [
        S({
          discipline: 'swim',
          title: 'Easy Swim or Full Rest',
          baseDuration: [25, 40],
          intensity: 'easy',
          effort: 'Z1 — drills and feel',
          focus: ['Feel for the water', 'Prep gear for the weekend'],
          structure: ['Drill/swim by 50s', 'Nothing hard'],
          primary: true,
        }),
        mobility,
      ],
    },
    // Saturday — long run / brick + environment reset
    {
      focus: 'Long run / Brick + Environment Reset',
      sessions: [
        S({
          discipline: phase === 'P3' ? 'brick' : 'run',
          title: longRunTitle[phase],
          baseDuration: [70, 120],
          intensity: 'easy',
          effort: 'Z2 — finish knowing you had more',
          focus: ['Fuel every 30-40 min', 'Even pacing'],
          structure: ['Steady aerobic effort', 'Walk breaks are tools, not failures'],
          primary: true,
        }),
      ],
    },
  ]

  // Phase-specific overrides
  if (phase === 'P0') {
    base[2].sessions[0].baseDuration = [30, 45]
    base[2].sessions[0].intensity = 'easy'
    base[2].sessions[0].structure = ['10 min walk/jog warm-up', 'Main: relaxed aerobic running', '5 min walk down']
    base[6].sessions[0].baseDuration = [50, 80]
    base[0].sessions[0].baseDuration = [60, 100]
  }
  if (phase === 'P1') {
    base[2].sessions[0].structure = ['10 min easy', 'Main: steady Z2 with 6 × 20s strides', '10 min easy']
  }
  if (phase === 'P2') {
    base[4].sessions[0].baseDuration = [50, 65] // strength emphasis phase
    base[6].sessions[0].baseDuration = [80, 140]
    base[0].sessions[0].baseDuration = [120, 210]
  }
  if (phase === 'P3') {
    // Race-specific: Saturday becomes the brick
    base[6].sessions[0] = S({
      discipline: 'brick',
      title: 'Brick Session (Bike + Run)',
      baseDuration: [90, 150],
      intensity: 'moderate',
      effort: 'Bike easy-moderate, run off the bike at easy pace',
      focus: ['Quick transition', 'Running on tired legs', 'Pacing patience'],
      structure: ['Bike 60-70% of duration at race effort', 'Transition under 3 min', 'Run the remainder at easy pace'],
      primary: true,
    })
    base[0].sessions[0].baseDuration = [150, 240]
    base[0].sessions[0].effort = 'Race effort blocks — practice goal watts/pace'
    base[2].sessions[0].structure = ['10 min easy', 'Main: race-pace intervals (3-4 × 10 min)', '10 min easy']
    base[3].sessions[0].structure = ['400 warm-up', 'Main: race-pace 100s on tight rest, open-water skills', '200 easy']
  }
  if (phase === 'P4') {
    for (const day of base) {
      for (const s of day.sessions) {
        if (s.intensity === 'hard') s.intensity = 'moderate'
      }
    }
    base[6].sessions[0].baseDuration = [40, 60]
    base[0].sessions[0].baseDuration = [60, 90]
    base[4].sessions[0].focus = ['Feel for the water', 'Race-week logistics check']
  }
  return base
}

/**
 * Phase duration multiplier with week-of-phase position factor:
 * ease in at the start of a phase, mini-taper at the end.
 * Clamped to [0.6, 1.15] — 0.6× deep taper, 1.15× peak build.
 */
export function getDurationScale(phase: PhaseInfo): number {
  const baseByPhase: Record<PhaseId, number> = {
    P0: 0.8,
    P1: 0.95,
    P2: 1.05,
    P3: 1.15,
    P4: 0.7,
  }
  let positionFactor = 1.0
  if (phase.weekOfPhase === 1) positionFactor = 0.92 // ease in
  else if (phase.weekOfPhase >= phase.totalWeeks) positionFactor = 0.9 // mini-taper

  // Taper deepens through P4 toward race day, bottoming at the 0.6 floor.
  if (phase.id === 'P4') {
    const progress = (phase.weekOfPhase - 1) / Math.max(phase.totalWeeks - 1, 1)
    return clamp(0.75 - 0.15 * progress, 0.6, 1.15)
  }
  return clamp(baseByPhase[phase.id] * positionFactor, 0.6, 1.15)
}

export function buildBlocks(sessions: SessionSpec[], scale: number): WorkoutBlock[] {
  return sessions.map((s) => ({
    discipline: s.discipline,
    title: s.title,
    durationRange:
      s.discipline === 'rest'
        ? [0, 0]
        : [Math.round(s.baseDuration[0] * scale), Math.round(s.baseDuration[1] * scale)],
    intensity: s.intensity,
    effort: s.effort,
    focus: [...s.focus],
    structure: [...s.structure],
    primary: s.primary ?? false,
    optional: s.optional ?? false,
    scaledBy: round2(scale),
    modifications: [],
  }))
}

const INTENSITY_DOWN: Record<Intensity, Intensity> = {
  hard: 'moderate',
  moderate: 'easy',
  easy: 'recovery',
  recovery: 'recovery',
}

/** Applies fatigue/sleep intensity reduction and deload-week compression. */
export function applyAdaptations(
  blocks: WorkoutBlock[],
  state: UserState,
  isDeloadWeek: boolean,
): { blocks: WorkoutBlock[]; flags: ProtocolFlag[] } {
  const flags: ProtocolFlag[] = []
  let out = blocks.map((b) => ({ ...b, focus: [...b.focus], structure: [...b.structure], modifications: [...b.modifications] }))

  if (isDeloadWeek) {
    flags.push('deload')
    out = out.map((b) => {
      if (b.discipline === 'rest') return b
      const next = { ...b }
      next.durationRange = [Math.round(b.durationRange[0] * 0.6), Math.round(b.durationRange[1] * 0.6)]
      if (next.intensity === 'hard' || next.intensity === 'moderate') next.intensity = 'easy'
      next.modifications = [...next.modifications, 'Deload week: volume cut ~40%, intensity capped at easy']
      return next
    })
  } else if (shouldReduceIntensity(state)) {
    flags.push('intensity_reduced')
    const reason = state.recentFatigue > 7 ? `fatigue ${state.recentFatigue}/10` : `sleep ${state.recentSleepHours}h`
    out = out.map((b) => {
      if (b.discipline === 'rest') return b
      const next = { ...b }
      next.intensity = INTENSITY_DOWN[b.intensity]
      next.durationRange = [Math.round(b.durationRange[0] * 0.85), Math.round(b.durationRange[1] * 0.85)]
      next.modifications = [...next.modifications, `Intensity reduced (${reason}) — easy effort, shorter range`]
      return next
    })
  }
  return { blocks: out, flags }
}

interface SwapRule {
  blocked: (b: WorkoutBlock) => boolean
  replacement: (severity: Injury['severity']) => WorkoutBlock | null
  note: string
}

const aquaJog = (severity: number): WorkoutBlock => ({
  discipline: 'swim',
  title: severity >= 3 ? 'Aqua Jog (run replacement)' : 'Aqua Jog / Easy Bike (run replacement)',
  durationRange: [30, 45],
  intensity: 'easy',
  effort: 'Z1-Z2 — keep aerobic stimulus, zero impact',
  focus: ['Protect the injury', 'Keep the engine ticking'],
  structure: ['Aqua jog or easy spin for the listed duration'],
  primary: true,
  optional: false,
  scaledBy: 1,
  modifications: [],
})

const SWAP_RULES: Record<Injury['area'], SwapRule> = {
  knee: {
    blocked: (b) => b.discipline === 'run',
    replacement: (sev) => aquaJog(sev),
    note: 'knee injury: running removed',
  },
  ankle: {
    blocked: (b) => b.discipline === 'run',
    replacement: (sev) => aquaJog(sev),
    note: 'ankle injury: running removed',
  },
  foot: {
    blocked: (b) => b.discipline === 'run',
    replacement: (sev) => aquaJog(sev),
    note: 'foot injury: running removed',
  },
  hip: {
    blocked: (b) => b.discipline === 'run',
    replacement: (sev) => aquaJog(sev),
    note: 'hip injury: running swapped for non-impact work',
  },
  shoulder: {
    blocked: (b) => b.discipline === 'swim',
    replacement: () => ({
      discipline: 'bike',
      title: 'Easy Bike (swim replacement)',
      durationRange: [40, 60],
      intensity: 'easy',
      effort: 'Z2 — aerobic substitute while the shoulder heals',
      focus: ['No overhead loading anywhere today'],
      structure: ['Steady spin, flat route'],
      primary: true,
      optional: false,
      scaledBy: 1,
      modifications: [],
    }),
    note: 'shoulder injury: swimming removed, no overhead pressing',
  },
  back: {
    blocked: (b) => b.discipline === 'strength',
    replacement: () => ({
      discipline: 'mobility',
      title: 'Core & Mobility (strength replacement)',
      durationRange: [25, 35],
      intensity: 'recovery',
      effort: 'Pain-free range only',
      focus: ['McGill big-3', 'No loaded spinal flexion'],
      structure: ['Bird dogs, side planks, curl-ups', 'Hip hinge patterning, bodyweight only'],
      primary: true,
      optional: false,
      scaledBy: 1,
      modifications: [],
    }),
    note: 'back injury: heavy lifting removed',
  },
}

/**
 * Removes or swaps contraindicated work. Brick sessions lose only the
 * affected leg (e.g. knee → bike-only brick).
 */
export function applyInjurySwaps(blocks: WorkoutBlock[], injuries: Injury[]): WorkoutBlock[] {
  if (injuries.length === 0) return blocks
  let out = [...blocks]
  for (const injury of injuries) {
    const rule = SWAP_RULES[injury.area]
    if (!rule) continue
    const next: WorkoutBlock[] = []
    let swapped = false
    for (const b of out) {
      if (b.discipline === 'brick' && ['knee', 'ankle', 'foot', 'hip'].includes(injury.area)) {
        next.push({
          ...b,
          discipline: 'bike',
          title: b.title.replace(/Brick.*$/i, 'Bike Only (brick run leg removed)'),
          structure: ['Ride the full duration at planned brick effort', 'Skip the run leg entirely'],
          modifications: [...b.modifications, `Injury (${injury.area}): run leg removed from brick`],
        })
        swapped = true
      } else if (rule.blocked(b)) {
        if (!swapped && b.primary) {
          const rep = rule.replacement(injury.severity)
          if (rep) {
            next.push({ ...rep, modifications: [`Injury (${injury.area}): swapped in for ${b.title}`] })
            swapped = true
          }
        }
        // contraindicated optional sessions are simply dropped
      } else {
        next.push(b)
      }
    }
    out = next
  }
  return out
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi)
const round2 = (n: number) => Math.round(n * 100) / 100
