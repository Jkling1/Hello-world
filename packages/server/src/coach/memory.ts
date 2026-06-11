import type { DB } from '../db.ts'
import { selectProvider } from './provider.ts'
import { parseStrictJson, validateMemories } from './json.ts'

const EXTRACTION_SYSTEM = `You extract durable long-term memories from what Jordan says — stated intentions, struggles, preferences, wins, and concrete facts a coach should hold him accountable to later. Ignore small talk and anything about the assistant. Return ONLY a JSON object, no prose, no code fences: {"memories":[{"content":"...","category":"intention|preference|concern|fact|win","salience":1-10}]}. Return {"memories":[]} if nothing is worth remembering.`

function isDuplicate(db: DB, content: string): boolean {
  const norm = content.toLowerCase().replace(/\s+/g, ' ').trim()
  const recent = db
    .prepare('SELECT content FROM coach_memories WHERE archived = 0 ORDER BY id DESC LIMIT 50')
    .all() as Array<{ content: string }>
  return recent.some((r) => {
    const other = r.content.toLowerCase().replace(/\s+/g, ' ').trim()
    return other === norm || other.includes(norm) || norm.includes(other)
  })
}

function store(db: DB, memories: Array<{ content: string; category: string; salience: number }>, source: string, sourceMessageId?: number): number {
  const insert = db.prepare(
    `INSERT INTO coach_memories (content, category, salience, source, source_message_id) VALUES (?, ?, ?, ?, ?)`,
  )
  let stored = 0
  for (const m of memories) {
    if (isDuplicate(db, m.content)) continue
    insert.run(m.content, m.category, m.salience, source, sourceMessageId ?? null)
    stored++
  }
  return stored
}

/**
 * Extracts memories from arbitrary text (journal entries, voice transcripts).
 * Best-effort: errors are swallowed by callers; works keyless via the mock provider.
 */
export async function extractMemoriesFromText(db: DB, text: string, source: 'journal' | 'chat', sourceMessageId?: number): Promise<number> {
  if (!text || text.trim().length < 12) return 0
  const provider = selectProvider()
  const raw = await provider.complete({
    system: EXTRACTION_SYSTEM,
    prompt: `Jordan wrote:\n"""\n${text.slice(0, 4000)}\n"""\nReturn the JSON object with "memories" now.`,
    maxTokens: 600,
  })
  const parsed = parseStrictJson(raw, validateMemories)
  if (!parsed) return 0
  return store(db, parsed.memories, source, sourceMessageId)
}

/** Fire-and-forget extraction after each chat exchange. */
export function extractFromExchange(db: DB, userMsg: string, assistantMsg: string, messageId: number): void {
  extractMemoriesFromText(db, `${userMsg}\n\n(coach replied: ${assistantMsg.slice(0, 400)})`, 'chat', messageId).catch(() => {
    /* memory is enrichment, never a failure mode */
  })
}
