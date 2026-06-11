import {
  formatProtocolMarkdown,
  generateDailyProtocol,
  getDayNumber,
  getDaysToRace,
  getPhase,
  getTotalDays,
  addDays,
  type ISODate,
} from '@vantage/engine'
import type { DB } from '../db.ts'
import { buildUserState, getProfile, getProgramConfig } from '../state.ts'
import type { ChatMessage } from './provider.ts'

/** Ground-truth profile the coach always has — §3 of the brief. */
const JORDAN_PROFILE = `
Jordan Kling, Loves Park / Rockford, Illinois.
- Businesses: Priority One Cleaning Service (commercial + medical/hazmat facility cleaning, sole operator ~14 years, started at 17); Fix & Finish (finish carpentry + restoration); Kling & Co. / Kling Woodworks (custom woodworking).
- The arc: transformed from ~300 lbs into an endurance athlete. Chicago Marathon finisher, Rockford Ironman 70.3 finisher, multiple open-water swims.
- Rides a BMC TimeMachine tri bike named "Nighthawk". Team Zoot ambassador. Rudy Project ambassador (Wing aero helmet).
- NASM certified, Behavior Change Specialization. Volunteers as water-safety paddler for the Rockford Ironman.
- Plays guitar, writes original music as J. Kling ("Cold as Stone", "Fire and Steel", "More Rain"). Grows food as 815 Farmacy. Has a male dog. Favorite color: baby blue.
`.trim()

const PERSONA = `
You are Jordan's coach inside Vantage (Project IronMind) — the app he built to get himself across the Ironman Florida finish line, and you say so when it fits: "You're the one who built me to get you across the Ironman Florida finish line."
Voice: direct, motivating, never fluffy. Systems over goals. Consistency over intensity. Identity over motivation. Reference his real history and his own past words back to him. Hold him accountable to stated intentions, with timestamps ("3 weeks ago you said..."). Adjust training in plain language when he asks. Never invent data not in the context below.
`.trim()

function relativeAge(createdAt: string, today: ISODate): string {
  const days = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(createdAt.replace(' ', 'T') + 'Z')) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 14) return `${days} days ago`
  if (days < 60) return `${Math.round(days / 7)} weeks ago`
  return `${Math.round(days / 30)} months ago`
}

/** Assembles the full system prompt + recent messages for the provider. */
export function assembleCoachContext(
  db: DB,
  opts: { date: ISODate; conversationId?: number },
): { system: string; messages: ChatMessage[] } {
  const { date, conversationId } = opts
  const config = getProgramConfig(db)
  const profile = getProfile(db)
  const state = buildUserState(db, date)
  const protocol = generateDailyProtocol(date, state, config)
  const phase = getPhase(date, config)

  const sections: string[] = []
  sections.push(PERSONA)
  sections.push(`## Athlete profile\n${JORDAN_PROFILE}`)
  if (profile.persona_notes) sections.push(`## Owner notes\n${profile.persona_notes}`)
  sections.push(
    `## Where we are\nDate: ${date}. Day ${getDayNumber(date, config)} of ${getTotalDays(config)}. ${getDaysToRace(date, config)} days to ${config.raceName} (${config.raceDate}).\nPhase: ${phase.name} (week ${phase.weekOfPhase}/${phase.totalWeeks}).`,
  )
  sections.push(
    `## Current state (rolling 7-day)\nfatigue ${state.recentFatigue}/10 · mood ${state.recentMood}/10 · sleep ${state.recentSleepHours}h · adherence ${Math.round(state.recentAdherence * 100)}% · missed-day streak ${state.consecutiveMissedDays}` +
      (state.currentInjuries.length ? ` · injuries: ${state.currentInjuries.map((i) => i.area).join(', ')}` : '') +
      (protocol.isDeloadWeek ? ' · DELOAD WEEK ACTIVE' : ''),
  )
  sections.push(`## Today's protocol\n${formatProtocolMarkdown(protocol)}`)

  const memories = db
    .prepare(
      `SELECT id, content, category, salience, created_at FROM coach_memories
       WHERE archived = 0 ORDER BY salience DESC, created_at DESC LIMIT 12`,
    )
    .all() as Array<{ id: number; content: string; category: string; salience: number; created_at: string }>
  if (memories.length) {
    sections.push(
      `## Long-term memory (his own words — hold him to these)\n` +
        memories.map((m) => `- ${relativeAge(m.created_at, date)} [${m.category}]: ${m.content}`).join('\n'),
    )
    const touch = db.prepare(`UPDATE coach_memories SET last_referenced_at = datetime('now') WHERE id = ?`)
    for (const m of memories) touch.run(m.id)
  }

  const workouts = db
    .prepare(
      `SELECT date, type, title, duration_min, distance_km, feeling FROM workouts
       WHERE date > ? AND date <= ? ORDER BY date DESC LIMIT 12`,
    )
    .all(addDays(date, -7), date) as Array<Record<string, never>>
  if (workouts.length) {
    sections.push(
      `## Last 7 days of training\n` +
        workouts
          .map(
            (w) =>
              `- ${w.date} ${w.type}${w.title ? ` (${w.title})` : ''}: ${Math.round(w.duration_min as number)}min${w.distance_km ? `, ${w.distance_km}km` : ''} — felt: "${w.feeling}"`,
          )
          .join('\n'),
    )
  }

  const journal = db
    .prepare('SELECT date, mood, content, voice_transcript FROM journal_entries ORDER BY date DESC, id DESC LIMIT 3')
    .all() as Array<{ date: string; mood: number | null; content: string; voice_transcript: string | null }>
  if (journal.length) {
    sections.push(
      `## Recent journal\n` +
        journal
          .map((j) => `- ${j.date}${j.mood ? ` (mood ${j.mood}/10)` : ''}: ${(j.content || j.voice_transcript || '').slice(0, 220)}`)
          .join('\n'),
    )
  }

  const books = db.prepare("SELECT title, author, current_page, total_pages FROM books WHERE status = 'active'").all() as Array<Record<string, never>>
  if (books.length) {
    sections.push(`## Active books\n` + books.map((b) => `- ${b.title}${b.author ? ` (${b.author})` : ''} — p.${b.current_page}/${b.total_pages ?? '?'}`).join('\n'))
  }

  const rocks = db.prepare('SELECT title, category, completed FROM tasks WHERE date = ? AND big_rock = 1').all(date) as Array<Record<string, never>>
  if (rocks.length) {
    sections.push(`## Today's Big Rocks\n` + rocks.map((r) => `- [${r.completed ? 'x' : ' '}] (${r.category}) ${r.title}`).join('\n'))
  }

  const milestones = db.prepare('SELECT title, completed FROM milestones ORDER BY sort_order').all() as Array<Record<string, never>>
  if (milestones.length) {
    sections.push(`## Roadmap\n` + milestones.map((m) => `- [${m.completed ? 'x' : ' '}] ${m.title}`).join('\n'))
  }

  let messages: ChatMessage[] = []
  if (conversationId) {
    const rows = db
      .prepare('SELECT role, content FROM coach_messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 20')
      .all(conversationId) as ChatMessage[]
    messages = rows.reverse()
  }

  return { system: sections.join('\n\n'), messages }
}
