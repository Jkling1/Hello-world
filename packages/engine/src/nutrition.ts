import type { NutritionBlock, PhaseInfo, WorkoutBlock } from './types.ts'

const LONG_SESSION_MIN = 90

/**
 * Fueling guidance that scales with the day. Sessions ≥90 min get
 * pre/during/post guidance; P3 long rides and bricks get race-specific
 * fueling practice.
 */
export function getNutritionBlock(blocks: WorkoutBlock[], phase: PhaseInfo): NutritionBlock {
  const guidance: string[] = []
  const longest = blocks.reduce((m, b) => Math.max(m, b.durationRange[1]), 0)
  const hasLong = longest >= LONG_SESSION_MIN
  const raceFuelPractice =
    phase.id === 'P3' && blocks.some((b) => (b.discipline === 'bike' || b.discipline === 'brick') && b.durationRange[1] >= LONG_SESSION_MIN)

  if (blocks.every((b) => b.discipline === 'rest' || b.optional)) {
    guidance.push('Rest day: protein anchor each meal, hydrate, no fueling windows to hit.')
    return { guidance, raceFuelPractice: false }
  }

  guidance.push('Daily base: protein at every meal, carbs proportional to today’s volume, 815 Farmacy greens where you can.')

  if (hasLong) {
    guidance.push(`Pre (90 min out): 60-80g carbs + 500ml fluid — oatmeal/banana/honey works.`)
    guidance.push('During: 60-90g carbs/hr after the first hour, 500-750ml fluid + sodium per hour.')
    guidance.push('Post (within 45 min): 25-30g protein + 1g/kg carbs. Don’t skip it because you’re busy.')
  } else {
    guidance.push('Under 90 min: water during is fine; normal meals around it.')
  }

  if (raceFuelPractice) {
    guidance.push(
      'RACE FUELING PRACTICE: use exact race-day products and timing today — same gels, same drink mix, same intervals. Log gut response after. Race day is not the day to improvise.',
    )
  }
  return { guidance, raceFuelPractice }
}
