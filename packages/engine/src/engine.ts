import type { DailyProtocol, ISODate, ProgramConfig, ProtocolFlag, UserState } from './types.ts'
import { DEFAULT_PROGRAM_CONFIG } from './config.ts'
import { dayOfWeek, getDayNumber, getDaysToRace, getPhase, getTotalDays, addDays } from './dates.ts'
import { shouldTriggerResetWeek } from './recovery.ts'
import { applyAdaptations, applyInjurySwaps, buildBlocks, getDurationScale, getWeeklyTemplate } from './training.ts'
import { getBigRocks, getLifeSystemsForDate } from './lifeSystems.ts'
import { getMindsetBlock } from './mindset.ts'
import { getNutritionBlock } from './nutrition.ts'

/**
 * The brain. Pure function: same date + state + config in, same protocol out.
 */
export function generateDailyProtocol(
  date: ISODate,
  state: UserState,
  config: ProgramConfig = DEFAULT_PROGRAM_CONFIG,
): DailyProtocol {
  const phase = getPhase(date, config)
  const daysToRace = getDaysToRace(date, config)
  const isDeloadWeek = state.activeDeloadWeek || shouldTriggerResetWeek(state)

  const template = getWeeklyTemplate(phase.id)[dayOfWeek(date)]
  const scale = getDurationScale(phase)

  let blocks = buildBlocks(template.sessions, scale)
  const adapted = applyAdaptations(blocks, state, isDeloadWeek)
  blocks = adapted.blocks
  const flags: ProtocolFlag[] = [...adapted.flags]

  if (state.currentInjuries.length > 0) {
    const before = JSON.stringify(blocks)
    blocks = applyInjurySwaps(blocks, state.currentInjuries)
    if (JSON.stringify(blocks) !== before) flags.push('injury_modified')
  }
  if (daysToRace >= 0 && daysToRace <= 7) flags.push('race_week')

  const mission = isDeloadWeek
    ? 'Deload week. The goal is absorption, not accumulation. Easy means easy.'
    : phase.mission

  return {
    date,
    dayNumber: getDayNumber(date, config),
    totalDays: getTotalDays(config),
    daysToRace,
    phase,
    isDeloadWeek,
    mission,
    workouts: blocks,
    bigRocks: getBigRocks(date, phase, state),
    lifeSystems: getLifeSystemsForDate(date),
    mindset: getMindsetBlock(date, phase, state, config),
    nutrition: getNutritionBlock(blocks, phase),
    flags,
  }
}

export function generateWeek(
  startDate: ISODate,
  state: UserState,
  config: ProgramConfig = DEFAULT_PROGRAM_CONFIG,
): DailyProtocol[] {
  return Array.from({ length: 7 }, (_, i) => generateDailyProtocol(addDays(startDate, i), state, config))
}
