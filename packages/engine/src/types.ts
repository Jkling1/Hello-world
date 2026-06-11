/** ISO calendar date, 'YYYY-MM-DD'. All engine math uses these — never Date objects across boundaries. */
export type ISODate = string

export type PhaseId = 'P0' | 'P1' | 'P2' | 'P3' | 'P4'

export interface PhaseDef {
  id: PhaseId
  name: string
  mission: string
  /** inclusive */
  start: ISODate
  /** inclusive */
  end: ISODate
}

export interface ProgramConfig {
  programStart: ISODate
  raceDate: ISODate
  raceName: string
  phases: PhaseDef[]
}

export interface PhaseInfo {
  id: PhaseId
  name: string
  mission: string
  start: ISODate
  end: ISODate
  /** 1-indexed week within the phase */
  weekOfPhase: number
  totalWeeks: number
}

export type Discipline = 'run' | 'swim' | 'bike' | 'strength' | 'brick' | 'mobility' | 'rest'
export type Intensity = 'recovery' | 'easy' | 'moderate' | 'hard'

export type InjuryArea = 'knee' | 'ankle' | 'foot' | 'hip' | 'back' | 'shoulder'

export interface Injury {
  area: InjuryArea
  /** 1 = niggle, 2 = limiting, 3 = no-go */
  severity: 1 | 2 | 3
}

export interface UserState {
  /** rolling avg, 1-10 */
  recentFatigue: number
  /** rolling avg, 1-10 */
  recentMood: number
  /** rolling avg, hours */
  recentSleepHours: number
  /** rolling avg, 0..1 */
  recentAdherence: number
  currentInjuries: Injury[]
  activeDeloadWeek: boolean
  consecutiveMissedDays: number
  /** missed days within the last 5 (drives reset-week trigger) */
  missedInLastFive: number
}

export interface DailyLogInput {
  date: ISODate
  fatigue: number | null
  mood: number | null
  sleepHours: number | null
  /** 0..1 */
  adherence: number | null
  missedWorkout: boolean
}

export interface WorkoutBlock {
  discipline: Discipline
  title: string
  /** [low, high] minutes after scaling */
  durationRange: [number, number]
  intensity: Intensity
  /** effort/zone guidance line */
  effort: string
  /** bullet focus cues */
  focus: string[]
  structure: string[]
  primary: boolean
  optional: boolean
  /** multiplier that was applied */
  scaledBy: number
  /** human notes about adaptations applied */
  modifications: string[]
}

export type TaskCategory = 'Fitness' | 'Mindset' | 'Knowledge' | 'Social' | 'Business' | 'Money'
export type Cadence = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface TaskSpec {
  title: string
  category: TaskCategory
  cadence: Cadence
  bigRock: boolean
}

export type MindsetKind = 'journal' | 'cbt' | 'visualization'

export interface MindsetBlock {
  kind: MindsetKind
  title: string
  prompt: string
  durationMin: number
  /** set when a condition override replaced the default rotation */
  triggeredBy: string | null
}

export interface NutritionBlock {
  guidance: string[]
  raceFuelPractice: boolean
}

export type ProtocolFlag = 'intensity_reduced' | 'deload' | 'injury_modified' | 'race_week'

export interface DailyProtocol {
  date: ISODate
  /** Day 0 = program start (Dec 1), matching "Day 257 / 341" convention */
  dayNumber: number
  totalDays: number
  daysToRace: number
  phase: PhaseInfo
  isDeloadWeek: boolean
  mission: string
  workouts: WorkoutBlock[]
  bigRocks: TaskSpec[]
  lifeSystems: TaskSpec[]
  mindset: MindsetBlock
  nutrition: NutritionBlock
  flags: ProtocolFlag[]
}

export const NEUTRAL_STATE: UserState = {
  recentFatigue: 5,
  recentMood: 6,
  recentSleepHours: 7.5,
  recentAdherence: 0.9,
  currentInjuries: [],
  activeDeloadWeek: false,
  consecutiveMissedDays: 0,
  missedInLastFive: 0,
}
