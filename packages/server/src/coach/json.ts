/**
 * Defensive parsing for model output that must be strict JSON.
 * Strips code fences, slices the outermost object, parses in try/catch,
 * then hand-validates. Returns null on any failure — callers never insert garbage.
 */
export function parseStrictJson<T>(raw: string, validate: (x: unknown) => T | null): T | null {
  if (!raw || typeof raw !== 'string') return null
  let text = raw.trim()
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    const parsed: unknown = JSON.parse(text.slice(start, end + 1))
    return validate(parsed)
  } catch {
    return null
  }
}

const CATEGORIES = ['Fitness', 'Mindset', 'Knowledge', 'Social', 'Business', 'Money']
const CADENCES = ['daily', 'weekly', 'monthly', 'yearly']

export interface GeneratedTask {
  title: string
  category: string
  bigRock: boolean
  cadence: string
}

export function validateTasks(x: unknown): { tasks: GeneratedTask[] } | null {
  if (!x || typeof x !== 'object' || !Array.isArray((x as { tasks?: unknown }).tasks)) return null
  const tasks: GeneratedTask[] = []
  for (const t of (x as { tasks: unknown[] }).tasks) {
    if (!t || typeof t !== 'object') continue
    const o = t as Record<string, unknown>
    if (typeof o.title !== 'string' || o.title.trim().length === 0) continue
    tasks.push({
      title: o.title.trim().slice(0, 200),
      category: CATEGORIES.includes(o.category as string) ? (o.category as string) : 'Fitness',
      bigRock: o.bigRock === true,
      cadence: CADENCES.includes(o.cadence as string) ? (o.cadence as string) : 'daily',
    })
  }
  return tasks.length > 0 ? { tasks } : null
}

export interface ExtractedMemory {
  content: string
  category: string
  salience: number
}

const MEMORY_CATEGORIES = ['intention', 'preference', 'concern', 'fact', 'win']

export function validateMemories(x: unknown): { memories: ExtractedMemory[] } | null {
  if (!x || typeof x !== 'object' || !Array.isArray((x as { memories?: unknown }).memories)) return null
  const memories: ExtractedMemory[] = []
  for (const m of (x as { memories: unknown[] }).memories) {
    if (!m || typeof m !== 'object') continue
    const o = m as Record<string, unknown>
    if (typeof o.content !== 'string' || o.content.trim().length < 4) continue
    const salience = typeof o.salience === 'number' ? Math.min(Math.max(Math.round(o.salience), 1), 10) : 5
    memories.push({
      content: o.content.trim().slice(0, 400),
      category: MEMORY_CATEGORIES.includes(o.category as string) ? (o.category as string) : 'fact',
      salience,
    })
  }
  return { memories }
}

export interface PlanAdjustment {
  summary: string
  stateOverrides: { activeDeloadWeek?: boolean; injuries?: Array<{ area: string; severity: number }> }
  taskChanges: GeneratedTask[]
}

export function validateAdjustment(x: unknown): PlanAdjustment | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  if (typeof o.summary !== 'string' || o.summary.trim().length === 0) return null
  const so = (o.stateOverrides && typeof o.stateOverrides === 'object' ? o.stateOverrides : {}) as Record<string, unknown>
  const stateOverrides: PlanAdjustment['stateOverrides'] = {}
  if (typeof so.activeDeloadWeek === 'boolean') stateOverrides.activeDeloadWeek = so.activeDeloadWeek
  if (Array.isArray(so.injuries)) {
    stateOverrides.injuries = so.injuries
      .filter((i): i is Record<string, unknown> => !!i && typeof i === 'object')
      .filter((i) => typeof i.area === 'string')
      .map((i) => ({ area: i.area as string, severity: typeof i.severity === 'number' ? i.severity : 2 }))
  }
  const tc = Array.isArray(o.taskChanges) ? validateTasks({ tasks: o.taskChanges })?.tasks ?? [] : []
  return { summary: o.summary.trim(), stateOverrides, taskChanges: tc }
}
