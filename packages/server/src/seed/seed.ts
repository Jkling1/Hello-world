import 'dotenv/config'
import {
  addDays,
  dayOfWeek,
  generateDailyProtocol,
  getPhase,
  NEUTRAL_STATE,
  type ISODate,
} from '@vantage/engine'
import { getDb, type DB } from '../db.ts'
import { getProgramConfig, getSetting, setSetting, today } from '../state.ts'
import { evaluateAchievements } from '../achievements.ts'

const SEED_VERSION = '1'

/**
 * Idempotent demo seed, anchored to "today" so Mission Control is alive on
 * first launch at any point in the program. Everything is source='seed';
 * `--reset` purges seed rows first. Run: npm run seed [-- --reset]
 */
function main(): void {
  const db = getDb()
  const reset = process.argv.includes('--reset')

  if (reset) purgeSeeds(db)
  if (getSetting(db, 'seed_version') === SEED_VERSION && !reset) {
    console.log('Seed already applied — nothing to do. (Use `npm run seed -- --reset` to reapply.)')
    return
  }

  const t = today()
  seedMilestones(db)
  seedBudget(db)
  seedWorkoutsAndLogs(db, t)
  seedJournal(db, t)
  seedBooks(db)
  seedCoach(db, t)
  seedTodayTasks(db, t)

  // Backdate legacy achievements, then evaluate the data-driven ones.
  const backdate = db.prepare(`UPDATE achievements SET unlocked_at = ? WHERE code = ? AND unlocked_at IS NULL`)
  backdate.run('2024-10-13 12:00:00', 'marathon')
  backdate.run('2025-06-15 12:00:00', 'half_iron')
  backdate.run('2025-08-02 12:00:00', 'ow_swim')
  evaluateAchievements(db, t)

  setSetting(db, 'seed_version', SEED_VERSION)
  const counts = ['workouts', 'daily_logs', 'journal_entries', 'books', 'milestones', 'budget_items', 'coach_memories']
    .map((tbl) => `${tbl}=${(db.prepare(`SELECT COUNT(*) AS n FROM ${tbl}`).get() as { n: number }).n}`)
    .join(' ')
  console.log(`Seed v${SEED_VERSION} applied (anchored to ${t}): ${counts}`)
}

function purgeSeeds(db: DB): void {
  for (const tbl of ['workouts', 'daily_logs', 'journal_entries', 'tasks', 'milestones', 'budget_items', 'books']) {
    db.prepare(`DELETE FROM ${tbl} WHERE source = 'seed'`).run()
  }
  db.prepare(`DELETE FROM book_notes WHERE book_id NOT IN (SELECT id FROM books)`).run()
  db.prepare(`DELETE FROM coach_memories WHERE source = 'seed'`).run()
  db.prepare(`DELETE FROM settings WHERE key = 'seed_version'`).run()
  console.log('Purged previous seed data.')
}

function seedMilestones(db: DB): void {
  if ((db.prepare('SELECT COUNT(*) AS n FROM milestones').get() as { n: number }).n > 0) return
  const ins = db.prepare(
    `INSERT INTO milestones (title, description, target_date, completed, completed_at, sort_order, source)
     VALUES (?, ?, ?, ?, ?, ?, 'seed')`,
  )
  ins.run('Reach peak physical condition', 'From 300 lbs to athlete. The transformation that started it all.', null, 1, '2025-11-15', 0)
  ins.run('Complete the Chicago Marathon', '26.2 in the books.', null, 1, '2024-10-13', 1)
  ins.run('Finish Rockford Ironman 70.3', 'Half iron on home water.', null, 1, '2025-06-15', 2)
  ins.run('Complete a 2.4-mile open water swim', 'Full iron swim distance, open water.', null, 1, '2025-08-02', 3)
  ins.run('Complete a 112-mile century ride', 'Full iron bike distance on Nighthawk.', '2026-08-30', 0, null, 4)
  ins.run('Epic brick workout', 'Long ride + run off the bike. Race-day dress rehearsal.', '2026-09-26', 0, null, 5)
  ins.run('Register for Ironman Florida', 'Click the button. Make it real.', '2026-07-01', 0, null, 6)
}

function seedBudget(db: DB): void {
  if ((db.prepare('SELECT COUNT(*) AS n FROM budget_items').get() as { n: number }).n > 0) return
  const ins = db.prepare(
    `INSERT INTO budget_items (label, planned_cents, spent_cents, sort_order, source) VALUES (?, ?, ?, ?, 'seed')`,
  )
  ins.run('Race entry', 110000, 0, 0)
  ins.run('Travel & hotel', 150000, 42000, 1)
  ins.run('Gear', 400000, 235000, 2)
  ins.run('Nutrition', 35000, 12000, 3)
}

/** ~6 weeks of plausible history generated from the engine's own templates. */
function seedWorkoutsAndLogs(db: DB, t: ISODate): void {
  if ((db.prepare(`SELECT COUNT(*) AS n FROM workouts WHERE source = 'seed'`).get() as { n: number }).n > 0) return
  const config = getProgramConfig(db)
  const insW = db.prepare(
    `INSERT INTO workouts (date, type, title, duration_min, distance_km, effort, feeling, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'seed')`,
  )
  const insL = db.prepare(
    `INSERT INTO daily_logs (date, fatigue, mood, sleep_hours, adherence, missed_workout, source)
     VALUES (?, ?, ?, ?, ?, ?, 'seed')
     ON CONFLICT(date) DO NOTHING`,
  )

  const feelings = [
    'Felt strong — engine is building.',
    'Legs heavy early, came around by the end.',
    'Pushed past a mental wall today.',
    'Easy and smooth. Boring on purpose.',
    'Tough one. Showed up anyway.',
    'Best session of the block.',
    'Grinding, but the grind is the point.',
    'Felt like an athlete today, not a project.',
    'Negative split it. Patience paying off.',
    'Shoulders tight from work, swam through it.',
    'Nighthawk felt fast. Aero is free speed.',
    'Hot one. Nailed the fueling anyway.',
  ]
  // a deliberate rough patch ~3 weeks back (referenced by seed memories), recovered since
  const roughStart = 24
  const roughEnd = 20

  // deterministic pseudo-random so reseeding is reproducible
  let seedNum = 42
  const rand = () => ((seedNum = (seedNum * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)

  const paceKmh: Record<string, number> = { run: 9.5, bike: 28, swim: 3.2, brick: 20 }
  let missedBudget = 3

  for (let back = 42; back >= 1; back--) {
    const date = addDays(t, -back)
    const inRough = back <= roughStart && back >= roughEnd
    const protocol = generateDailyProtocol(date, NEUTRAL_STATE, config)
    const primary = protocol.workouts.find((w) => w.primary && w.discipline !== 'rest')

    const missDay = inRough && missedBudget > 0 && rand() < 0.45
    if (missDay) missedBudget--

    if (primary && !missDay) {
      const [lo, hi] = primary.durationRange
      const duration = Math.round(lo + (hi - lo) * rand())
      const type = primary.discipline === 'mobility' ? 'other' : primary.discipline
      const kmh = paceKmh[type]
      const distance = kmh ? Math.round(((duration / 60) * kmh + rand() * 3) * 10) / 10 : null
      const effort = primary.intensity === 'hard' ? 8 : primary.intensity === 'moderate' ? 6 : 4
      insW.run(date, type, primary.title, duration, distance, effort, feelings[Math.floor(rand() * feelings.length)])
    }

    const fatigue = inRough ? 7 + Math.round(rand()) : 4 + Math.round(rand() * 2)
    const mood = inRough ? 4 + Math.round(rand()) : 6 + Math.round(rand() * 3)
    const sleep = inRough ? 5.5 + rand() : 6.8 + rand() * 1.6
    insL.run(
      date,
      fatigue,
      Math.min(mood, 10),
      Math.round(sleep * 10) / 10,
      missDay ? 0 : 1,
      missDay ? 1 : 0,
    )
  }
}

function seedJournal(db: DB, t: ISODate): void {
  if ((db.prepare(`SELECT COUNT(*) AS n FROM journal_entries WHERE source = 'seed'`).get() as { n: number }).n > 0) return
  const ins = db.prepare(
    `INSERT INTO journal_entries (date, mood, content, voice_transcript, tags, source) VALUES (?, ?, ?, ?, ?, 'seed')`,
  )
  const entries: Array<[number, number, string, string | null]> = [
    [40, 7, 'Long ride felt like flying. Nighthawk and I are starting to speak the same language. Century ride in August is the next mountain — 112 miles. Writing it here so I can’t un-say it.', null],
    [35, 8, 'Closed two Priority One contracts before the morning swim. The business funds the dream; the dream disciplines the business. Integration, not balance.', null],
    [31, 6, 'Strength day. Knee felt a little cranky on split squats — watching it, not panicking. Iced it tonight.', null],
    [27, 5, 'Hard week. Work piled up and I skipped the swim. One missed session is data, not identity.', null],
    [24, 4, 'Rough patch. Sleep is garbage, fatigue is high, and I caught myself negotiating with the alarm. This is exactly when systems matter more than feelings.', null],
    [22, 4, null as never, 'Voice note: barely slept, work emergency at the medical facility ran past midnight. Body says rest. I want to stop staying up so late on weeknights — that has to change or August will eat me alive.'],
    [20, 5, 'Deload-ish few days. Read 30 pages of Endure instead of doom-scrolling. Hutchinson is right — the wall is mostly a story the brain tells.', null],
    [16, 7, 'Back. Easy run felt easy again. The rough patch broke like a fever. Noted what fixed it: sleep, sunlight, and saying no.', null],
    [12, 8, 'Brick rehearsal Saturday went better than expected. Legs off the bike felt alien for 5 minutes, then human. Proud of that one.', null],
    [8, 7, '815 Farmacy tomatoes are coming in. Played “Fire and Steel” on the porch. Good day to be alive in Loves Park.', null],
    [4, 8, null as never, 'Voice note: swim this morning was the best in months. Caught myself smiling at the bottom of the pool. Telling future me: remember this one in the dark miles.'],
    [1, 7, 'Planning week. Century route drafted — 112 miles with two resupply stops. Fear is down, respect is up.', null],
  ]
  for (const [back, mood, content, voice] of entries) {
    ins.run(addDays(t, -back), mood, content ?? '', voice, JSON.stringify([]))
  }
}

function seedBooks(db: DB): void {
  if ((db.prepare('SELECT COUNT(*) AS n FROM books').get() as { n: number }).n > 0) return
  const insB = db.prepare(
    `INSERT INTO books (title, author, total_pages, current_page, status, started_at, source) VALUES (?, ?, ?, ?, 'active', ?, 'seed')`,
  )
  const insN = db.prepare(`INSERT INTO book_notes (book_id, kind, content, tags, page) VALUES (?, ?, ?, ?, ?)`)
  const endure = insB.run('Endure', 'Alex Hutchinson', 312, 204, '2026-05-01').lastInsertRowid
  insN.run(endure, 'quote', '“The brain is the governor — fatigue is a feeling, not a fuel gauge.”', JSON.stringify(['mindset', 'racing']), 87)
  insN.run(endure, 'takeaway', 'Perceived effort can be trained like a muscle. Smiling literally lowers RPE — use it at mile 18.', JSON.stringify(['race-day']), 142)
  insN.run(endure, 'note', 'Heat adaptation chapter pairs perfectly with Florida in November. Re-read before taper.', JSON.stringify(['heat', 'taper']), 199)
  const deep = insB.run('Deep Work', 'Cal Newport', 296, 88, '2026-05-20').lastInsertRowid
  insN.run(deep, 'takeaway', 'Schedule deep blocks like training sessions — Priority One admin gets a container, not the whole day.', JSON.stringify(['business']), 60)
  insN.run(deep, 'quote', '“Clarity about what matters provides clarity about what does not.”', JSON.stringify(['systems']), 44)
}

function seedCoach(db: DB, t: ISODate): void {
  if ((db.prepare(`SELECT COUNT(*) AS n FROM coach_memories WHERE source = 'seed'`).get() as { n: number }).n > 0) return
  const insM = db.prepare(
    `INSERT INTO coach_memories (content, category, salience, source, created_at) VALUES (?, ?, ?, 'seed', ?)`,
  )
  const ts = (back: number) => `${addDays(t, -back)} 08:00:00`
  insM.run('Wants to break 13 hours at Ironman Florida.', 'intention', 9, ts(38))
  insM.run('Said he wants to stop staying up late on weeknights — sleep was wrecking his training during the May rough patch.', 'intention', 8, ts(22))
  insM.run('Knee felt cranky on split squats in mid-May; monitoring, not injured.', 'concern', 6, ts(31))
  insM.run('Century ride (112 mi) planned for late August — route drafted with two resupply stops.', 'fact', 7, ts(1))
  insM.run('Best swim in months on a recent morning — told future self to remember it “in the dark miles.”', 'win', 6, ts(4))

  if ((db.prepare('SELECT COUNT(*) AS n FROM coach_conversations').get() as { n: number }).n > 0) return
  const conv = db.prepare(`INSERT INTO coach_conversations (title) VALUES ('First check-in')`).run().lastInsertRowid
  const insMsg = db.prepare(`INSERT INTO coach_messages (conversation_id, role, content) VALUES (?, ?, ?)`)
  insMsg.run(conv, 'user', 'Alright. You’re live. Let’s see what you’ve got.')
  insMsg.run(
    conv,
    'assistant',
    'You’re the one who built me to get you across the Ironman Florida finish line — so let’s skip the pleasantries. You’re mid-build, the engine is real, and the century ride is the next domino. I’ll hold the plan; you hold the standard.',
  )
  insMsg.run(conv, 'user', 'Deal. Keep me honest about sleep, that’s where I slip.')
  insMsg.run(conv, 'assistant', 'Noted and remembered. Weeknight sleep is now a coaching priority — expect me to bring it up when the numbers dip.')
}

function seedTodayTasks(db: DB, t: ISODate): void {
  const config = getProgramConfig(db)
  const protocol = generateDailyProtocol(t, NEUTRAL_STATE, config)
  const exists = db.prepare('SELECT 1 FROM tasks WHERE date = ? AND title = ? LIMIT 1')
  const ins = db.prepare(
    `INSERT INTO tasks (date, title, category, cadence, big_rock, origin, source) VALUES (?, ?, ?, ?, ?, ?, 'seed')`,
  )
  for (const rock of protocol.bigRocks.slice(0, 2)) {
    if (!exists.get(t, rock.title)) ins.run(t, rock.title, rock.category, rock.cadence, 1, 'generated')
  }
  const systems = db
    .prepare('SELECT name, category FROM life_systems WHERE active = 1 AND day_of_week = ?')
    .all(dayOfWeek(t)) as Array<{ name: string; category: string }>
  for (const s of systems) {
    if (!exists.get(t, s.name)) ins.run(t, s.name, s.category, 'weekly', 0, 'recurring')
  }
  // sanity: phase comes from config, not hardcoded anywhere in seeds
  void getPhase(t, config)
}

main()
