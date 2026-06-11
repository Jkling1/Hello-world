import type { DailyProtocol } from './types.ts'
import { formatLongDate } from './dates.ts'

/** Renders the protocol in the brief's sample style. */
export function formatProtocolMarkdown(p: DailyProtocol): string {
  const lines: string[] = []
  lines.push(`# ${formatLongDate(p.date)}`)
  const phaseShort = p.phase.name.split(' & ')[0].split(',')[0]
  lines.push(`${phaseShort} • Day ${p.dayNumber} / ${p.totalDays} • ${p.daysToRace} days to Ironman Florida`)
  if (p.flags.length > 0) lines.push(`Flags: ${p.flags.join(', ')}`)
  lines.push('')
  lines.push(`## Today's Mission`)
  lines.push(p.mission)
  lines.push('')
  lines.push('## Training Block')
  for (const w of p.workouts) {
    const label = w.primary ? 'Primary' : w.optional ? 'Optional' : 'Secondary'
    lines.push(`${label}: ${w.title}`)
    if (w.durationRange[1] > 0) lines.push(`- Duration: ${w.durationRange[0]}–${w.durationRange[1]} min`)
    lines.push(`- Effort: ${w.effort}`)
    if (w.focus.length) lines.push(`- Focus: ${w.focus.join(' · ')}`)
    for (const m of w.modifications) lines.push(`- ⚠ ${m}`)
    lines.push('')
  }
  if (p.bigRocks.length) {
    lines.push('## Big Rocks (max 3)')
    for (const r of p.bigRocks) lines.push(`- [${r.category}] ${r.title}`)
    lines.push('')
  }
  if (p.lifeSystems.length) {
    lines.push('## Life Systems')
    for (const s of p.lifeSystems) lines.push(`- [${s.category}] ${s.title}`)
    lines.push('')
  }
  lines.push(`## Mindset — ${p.mindset.title} (${p.mindset.durationMin} min)`)
  lines.push(p.mindset.prompt)
  lines.push('')
  lines.push('## Fueling')
  for (const g of p.nutrition.guidance) lines.push(`- ${g}`)
  return lines.join('\n')
}
