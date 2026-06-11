import { describe, expect, it } from 'vitest'
import { parseStrictJson, validateAdjustment, validateMemories, validateTasks } from '../coach/json.ts'

describe('parseStrictJson', () => {
  const valid = '{"tasks":[{"title":"Run","category":"Fitness","bigRock":true,"cadence":"daily"}]}'

  it('parses clean JSON', () => {
    expect(parseStrictJson(valid, validateTasks)?.tasks[0].title).toBe('Run')
  })

  it('strips code fences and prose prefixes', () => {
    expect(parseStrictJson('```json\n' + valid + '\n```', validateTasks)?.tasks).toHaveLength(1)
    expect(parseStrictJson('Here is your JSON:\n' + valid, validateTasks)?.tasks).toHaveLength(1)
  })

  it('returns null on garbage, truncated JSON, and empty input', () => {
    expect(parseStrictJson('not json at all', validateTasks)).toBeNull()
    expect(parseStrictJson('{"tasks":[{"title":"Run"', validateTasks)).toBeNull()
    expect(parseStrictJson('', validateTasks)).toBeNull()
    expect(parseStrictJson('{"tasks":"nope"}', validateTasks)).toBeNull()
  })

  it('sanitizes bad fields instead of trusting the model', () => {
    const messy = '{"tasks":[{"title":"X","category":"Hacking","bigRock":"yes","cadence":"hourly"},{"title":""}]}'
    const out = parseStrictJson(messy, validateTasks)
    expect(out?.tasks).toHaveLength(1)
    expect(out?.tasks[0]).toEqual({ title: 'X', category: 'Fitness', bigRock: false, cadence: 'daily' })
  })
})

describe('validateMemories', () => {
  it('clamps salience and drops empty content', () => {
    const out = validateMemories({ memories: [{ content: 'Wants sub-13', salience: 99 }, { content: 'x' }] })
    expect(out?.memories).toHaveLength(1)
    expect(out?.memories[0].salience).toBe(10)
    expect(out?.memories[0].category).toBe('fact')
  })
})

describe('validateAdjustment', () => {
  it('accepts a deload adjustment and filters junk injuries', () => {
    const out = validateAdjustment({
      summary: 'Deload time',
      stateOverrides: { activeDeloadWeek: true, injuries: [{ area: 'knee' }, { bogus: 1 }] },
      taskChanges: [],
    })
    expect(out?.stateOverrides.activeDeloadWeek).toBe(true)
    expect(out?.stateOverrides.injuries).toEqual([{ area: 'knee', severity: 2 }])
  })

  it('rejects output without a summary', () => {
    expect(validateAdjustment({ stateOverrides: {} })).toBeNull()
  })
})
