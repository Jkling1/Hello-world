import type { ISODate, PhaseInfo, TaskSpec, UserState } from './types.ts'
import { dayOfWeek } from './dates.ts'

/** Recurring weekly systems landing on fixed days. */
export function getLifeSystemsForDate(date: ISODate): TaskSpec[] {
  const dow = dayOfWeek(date)
  const systems: TaskSpec[] = []
  if (dow === 1)
    systems.push({ title: 'Weekly Money Review — P&L, invoices, upcoming bills', category: 'Money', cadence: 'weekly', bigRock: false })
  if (dow === 6)
    systems.push({ title: 'Environment Reset — shop, truck, gear staging, kitchen', category: 'Mindset', cadence: 'weekly', bigRock: false })
  if (dow === 0)
    systems.push({ title: 'Weekly Planning — schedule training + business blocks', category: 'Business', cadence: 'weekly', bigRock: false })
  return systems
}

/**
 * Phase-appropriate Big Rocks. Hard cap of 3/day — never overwhelm.
 * Condition-triggered rocks take priority over the phase rotation.
 */
export function getBigRocks(date: ISODate, phase: PhaseInfo, state: UserState): TaskSpec[] {
  const rocks: TaskSpec[] = []
  const rock = (title: string, category: TaskSpec['category']): TaskSpec => ({
    title,
    category,
    cadence: 'daily',
    bigRock: true,
  })

  // Condition-triggered first — these earn their slot.
  if (state.recentAdherence < 0.6)
    rocks.push(rock('Recommit: lay out tomorrow’s session tonight — gear, time, route', 'Mindset'))
  if (state.consecutiveMissedDays >= 2)
    rocks.push(rock('Break the miss streak: do the first 10 minutes, that’s the whole assignment', 'Fitness'))

  const dow = dayOfWeek(date)
  const byPhase: Record<string, TaskSpec[]> = {
    P0: [
      rock('Baseline check: log weight, resting HR, sleep — no judgment, just data', 'Fitness'),
      rock('Priority One: 90-min deep-work block on the schedule board', 'Business'),
      rock('Read 20 pages — knowledge is part of the build', 'Knowledge'),
    ],
    P1: [
      rock('Zone 2 discipline: keep every easy session honestly easy', 'Fitness'),
      rock('Fix & Finish: quote follow-ups before noon', 'Business'),
      rock('Call or message one person who matters — out of the cave', 'Social'),
    ],
    P2: [
      rock('Century-ride prep: route, fueling plan, support stops', 'Fitness'),
      rock('Strength quality over load — film one heavy set, check form', 'Fitness'),
      rock('Business systems hour: document one process you keep redoing', 'Business'),
    ],
    P3: [
      rock('Race Logistics Planning — travel, hotel, packet pickup windows', 'Business'),
      rock('Confirm Ironman Florida registration & USAT license', 'Fitness'),
      rock('Race fueling rehearsal: practice exact race-day nutrition on long sessions', 'Fitness'),
    ],
    P4: [
      rock('Pack list pass — gear bags, Nighthawk service check', 'Fitness'),
      rock('Visualization: 10 minutes — swim start, T1, dark miles of the run', 'Mindset'),
      rock('Set business autopilot: clients notified, week covered', 'Business'),
    ],
  }

  // Rotate the phase list by day-of-week so the same rock isn't first every day.
  const phaseRocks = byPhase[phase.id] ?? []
  const rotated = [...phaseRocks.slice(dow % phaseRocks.length), ...phaseRocks.slice(0, dow % phaseRocks.length)]
  rocks.push(...rotated)

  return rocks.slice(0, 3)
}
