import type { CoachProvider, CompleteOpts, StreamChatOpts } from './provider.ts'

/**
 * Deterministic keyless coach. It reads the same assembled context the real
 * provider gets (memories, today's protocol, recent training are embedded in
 * the system prompt) and composes a coherent, personal reply — so streaming,
 * memory callbacks, and the strict-JSON task pipeline all work without a key.
 */
export class MockProvider implements CoachProvider {
  readonly name = 'mock' as const
  readonly model = 'mock-coach-v1'

  async *streamChat(opts: StreamChatOpts): AsyncIterable<string> {
    const reply = this.composeReply(opts)
    for (const word of reply.split(/(?<= )/)) {
      await new Promise((r) => setTimeout(r, 8))
      yield word
    }
  }

  async complete(opts: CompleteOpts): Promise<string> {
    if (opts.prompt.includes('"tasks"')) return this.composeTasksJson(opts)
    if (opts.prompt.includes('"memories"')) return this.composeMemoriesJson(opts)
    if (opts.prompt.includes('"summary"')) return this.composeAdjustJson(opts)
    return this.composeReply({ system: opts.system, messages: [{ role: 'user', content: opts.prompt }] })
  }

  // ---- helpers -----------------------------------------------------------

  private pick(system: string, marker: string): string[] {
    const section = system.split(`## ${marker}`)[1]?.split(/\n## (?!Today's Mission)/)[0] ?? ''
    return section
      .split('\n')
      .map((l) => l.replace(/^[-•#]+\s*/, '').trim())
      .filter(
        (l) =>
          l.length > 4 &&
          !/^Day \d+ \//.test(l) &&
          !/^Flags:/.test(l) &&
          !/days to /.test(l) &&
          !/Today's Mission/.test(l) &&
          !/^(Sun|Mon|Tues|Wednes|Thurs|Fri|Satur)day, /.test(l),
      )
  }

  private composeReply(opts: StreamChatOpts): string {
    const sys = opts.system
    const userMsg = opts.messages.filter((m) => m.role === 'user').at(-1)?.content ?? ''
    const lower = userMsg.toLowerCase()

    const memories = this.pick(sys, 'Long-term memory')
    const protocolLines = this.pick(sys, "Today's protocol")
    const countdown = sys.match(/(\d+) days to (race day|Ironman[^.\n]*)/i)
    const phase = sys.match(/Phase: ([^\n(]+)/)?.[1]?.trim()

    const parts: string[] = []

    if (/wrecked|exhausted|tired|dead|smoked|fried/.test(lower)) {
      parts.push(
        "Heard. We don't negotiate with fatigue by pretending it isn't there — we adapt.",
        "Here's the adjustment: today's session drops to easy effort, short end of the duration range. If your legs say no after the first 10 minutes, you walk and we bank recovery instead.",
        'One rough day costs nothing. Three ignored ones cost a training block. Log your sleep and fatigue tonight so the engine sees what I see.',
      )
    } else if (/how am i doing|progress|on track/.test(lower)) {
      parts.push(
        `Straight answer: you're showing up, and the data backs it.${phase ? ` We're in ${phase} — exactly where the work compounds.` : ''}`,
      )
      if (protocolLines.length) parts.push(`Today's mission is simple: ${protocolLines[0]}`)
      if (countdown) parts.push(`${countdown[1]} days out. The kid who weighed 300 pounds doesn't get to doubt the guy reading this.`)
    } else {
      if (protocolLines.length) parts.push(`Here's where today points: ${protocolLines[0]}`)
      parts.push('Execute the session, log the feeling note after — that note is data I use to steer the plan.')
    }

    if (memories.length) {
      const m = memories[0].replace(/\s*\(salience.*$/, '')
      parts.push(`And while I have you — ${m} How's that holding up? Don't dodge it.`)
    }

    parts.push("You built me to get you across the Ironman Florida finish line. That's the job. Back to work.")
    return parts.join('\n\n')
  }

  private composeTasksJson(opts: CompleteOpts): string {
    const protocolLines = this.pick(opts.system, "Today's protocol")
    const tasks = [
      {
        title: protocolLines[0] ? `Execute: ${protocolLines[0].slice(0, 80)}` : 'Execute today’s primary session',
        category: 'Fitness',
        bigRock: true,
        cadence: 'daily',
      },
      { title: 'Log the session with an honest feeling note', category: 'Mindset', bigRock: false, cadence: 'daily' },
      { title: '10 minutes: tomorrow staged tonight — gear, fuel, time', category: 'Mindset', bigRock: false, cadence: 'daily' },
    ]
    return JSON.stringify({ tasks })
  }

  private composeMemoriesJson(opts: CompleteOpts): string {
    const text = opts.prompt
    const memories: Array<{ content: string; category: string; salience: number }> = []
    const intent = text.match(/I(?:'m| am| want to| plan to| promised to| committed to| need to| will)\s+([^.!?\n]{8,120})/i)
    if (intent) memories.push({ content: `Said: "I${intent[0].slice(1)}"`, category: 'intention', salience: 7 })
    const worry = text.match(/(?:worried|scared|afraid|anxious|struggling)\s+(?:about|with|that)?\s*([^.!?\n]{4,120})/i)
    if (worry) memories.push({ content: `Concern: ${worry[1].trim()}`, category: 'concern', salience: 6 })
    const win = text.match(/(?:proud|crushed|nailed|finally|breakthrough|first time)\s*([^.!?\n]{0,120})/i)
    if (win) memories.push({ content: `Win: ${win[0].trim()}`, category: 'win', salience: 5 })
    return JSON.stringify({ memories })
  }

  private composeAdjustJson(opts: CompleteOpts): string {
    const lower = opts.prompt.toLowerCase()
    if (/wrecked|exhausted|deload|tired|burned|injur/.test(lower)) {
      return JSON.stringify({
        summary:
          'Reading high fatigue. Flipping this week to deload: volume down ~40%, intensity capped at easy. The plan resumes the moment your numbers recover.',
        stateOverrides: { activeDeloadWeek: true },
        taskChanges: [],
      })
    }
    return JSON.stringify({
      summary: 'No structural change needed — state looks workable. Keep the week as generated and reassess after the long session.',
      stateOverrides: {},
      taskChanges: [],
    })
  }
}
