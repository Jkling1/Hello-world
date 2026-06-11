#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { NEUTRAL_STATE, type UserState } from './types.ts'
import { generateDailyProtocol, generateWeek } from './engine.ts'
import { formatProtocolMarkdown } from './format.ts'

const HELP = `vantage-engine — generate the daily protocol

Usage:
  vantage-engine [--date YYYY-MM-DD] [--json] [--week] [--state '<json>']

Options:
  --date    Date to generate for (default: today)
  --json    Emit the structured protocol object instead of markdown
  --week    Generate 7 days starting at --date
  --state   JSON UserState override, e.g. '{"recentFatigue":8.5}'
  --help    Show this help
`

const { values } = parseArgs({
  options: {
    date: { type: 'string' },
    json: { type: 'boolean', default: false },
    week: { type: 'boolean', default: false },
    state: { type: 'string' },
    help: { type: 'boolean', default: false },
  },
})

if (values.help) {
  console.log(HELP)
  process.exit(0)
}

const date = values.date ?? new Date().toISOString().slice(0, 10)
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error(`Invalid --date "${date}" — expected YYYY-MM-DD`)
  process.exit(1)
}

let state: UserState = { ...NEUTRAL_STATE }
if (values.state) {
  try {
    state = { ...state, ...JSON.parse(values.state) }
  } catch (e) {
    console.error(`Invalid --state JSON: ${(e as Error).message}`)
    process.exit(1)
  }
}

if (values.week) {
  const week = generateWeek(date, state)
  if (values.json) console.log(JSON.stringify(week, null, 2))
  else console.log(week.map(formatProtocolMarkdown).join('\n\n---\n\n'))
} else {
  const protocol = generateDailyProtocol(date, state)
  if (values.json) console.log(JSON.stringify(protocol, null, 2))
  else console.log(formatProtocolMarkdown(protocol))
}
