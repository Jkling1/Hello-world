import type { ISODate, MindsetBlock, PhaseInfo, UserState } from './types.ts'
import { dayOfWeek, getDaysToRace } from './dates.ts'
import type { ProgramConfig } from './types.ts'
import { DEFAULT_PROGRAM_CONFIG } from './config.ts'

/**
 * Phase-appropriate mindset work with condition-triggered overrides.
 * Overrides (highest priority first): race week → high fatigue → low mood → low adherence.
 */
export function getMindsetBlock(
  date: ISODate,
  phase: PhaseInfo,
  state: UserState,
  config: ProgramConfig = DEFAULT_PROGRAM_CONFIG,
): MindsetBlock {
  const daysToRace = getDaysToRace(date, config)

  if (daysToRace >= 0 && daysToRace <= 7) {
    return {
      kind: 'visualization',
      title: 'Race Week Rehearsal',
      prompt:
        'Close your eyes. Walk the whole day: the cannon, the washing machine of the swim start, settling into your line. T1. The first 30 flat miles on Nighthawk — patience. Special needs. The run, mile 18, when it gets quiet and dark. See yourself choosing your response. Finish chute. Hear it.',
      durationMin: 12,
      triggeredBy: 'race_week',
    }
  }
  if (state.recentFatigue > 7) {
    return {
      kind: 'cbt',
      title: 'Fatigue Reframe',
      prompt:
        'Thought record: write the thought ("I\'m falling behind"). Evidence for. Evidence against — include the volume you HAVE absorbed this block. Balanced thought. Fatigue is the receipt for work done; recovery is where it gets banked.',
      durationMin: 8,
      triggeredBy: 'high_fatigue',
    }
  }
  if (state.recentMood <= 3) {
    return {
      kind: 'cbt',
      title: 'Self-Compassion Check',
      prompt:
        'Write to yourself the way you\'d talk to a client who showed up at 300 lbs and kept showing up. Three sentences. Then name one tiny win from the last 48 hours — there is one.',
      durationMin: 8,
      triggeredBy: 'low_mood',
    }
  }
  if (state.recentAdherence < 0.6) {
    return {
      kind: 'journal',
      title: 'Recommit — Systems Over Goals',
      prompt:
        'Skip the guilt. Answer mechanically: What broke — time, energy, or plan? What is the smallest version of tomorrow\'s session you will definitely do? Schedule it now, exact time.',
      durationMin: 6,
      triggeredBy: 'low_adherence',
    }
  }

  // Default rotation: phase-appropriate prompts keyed by day of week.
  const rotations: Record<string, MindsetBlock[]> = {
    P0: [
      j('Identity Inventory', 'Who is the person who finishes Ironman Florida? List three things he does daily. Which one did you do today?'),
      j('What I Learned Today', 'One thing today taught you — about training, business, or yourself. One sentence is enough.'),
      j('Why This, Why Now', 'You started at 300 lbs. Write the line you\'ll want to read on a bad day in August.'),
    ],
    P1: [
      j('Consistency Audit', 'Streak check: what made showing up easy this week? Engineer more of that.'),
      j('How I Feel Today', 'Body scan, 1-10s: legs, lungs, head, motivation. No fixing, just data.'),
      j('Boring on Purpose', 'Zone 2 is a faith practice. Where else in life are you trusting a slow compounding process?'),
    ],
    P2: [
      j('Durability Evidence', 'What did your body handle this week that would have broken you a year ago?'),
      j('Scar Tissue Pride', 'We\'re not here to be perfect. Name a scar — training or life — you\'re oddly proud of.'),
      j('The Century Ahead', 'What about the 112-mile ride scares you? Write the fear, then the protocol that answers it.'),
    ],
    P3: [
      v('Race Visualization — Swim', 'Ten minutes: the 2.4-mile swim, start to T1. Contact in the water, finding feet, sighting the buoys. Calm is a pace.'),
      v('Race Visualization — Dark Miles', 'See mile 18 of the marathon. Legs gone, mind negotiating. Watch yourself run the next mile anyway. That\'s the whole race.'),
      j('Race-Specific Confidence', 'List today\'s evidence you can do this: paces hit, fueling executed, bricks survived.'),
    ],
    P4: [
      v('Taper Trust', 'The hay is in the barn. Visualize standing on the beach Nov 7 — trained, tapered, calm. Rest IS the work now.'),
      j('Letter to Race-Day Jordan', 'Write the note you\'ll read the night before: what you know, what you\'ve survived, how you\'ll respond when it gets hard.'),
      v('Finish Chute', 'Hear "Jordan Kling, YOU ARE AN IRONMAN." Sit with it for five full minutes. That\'s today\'s session.'),
    ],
  }
  const list = rotations[phase.id] ?? rotations.P0
  return list[dayOfWeek(date) % list.length]
}

const j = (title: string, prompt: string): MindsetBlock => ({
  kind: 'journal',
  title,
  prompt,
  durationMin: 6,
  triggeredBy: null,
})
const v = (title: string, prompt: string): MindsetBlock => ({
  kind: 'visualization',
  title,
  prompt,
  durationMin: 10,
  triggeredBy: null,
})
