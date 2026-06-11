# VANTAGE — PROJECT IRONMIND

> An all-in-one operating system for self-mastery. Part Strava, part Notion, part personal AI coach, part life archive — built around one mission: **Ironman Florida, November 7, 2026.**
>
> *We're not here to be perfect. We're here to become unbreakable and oddly proud of our scar tissue.*

## What it does

- **Mission Control** — time-aware greeting, `Day X / 341` countdown, phase badge, today's auto-generated protocol, streak/task/volume tiles, and a "Start Today" walkthrough that logs your morning state and regenerates the day around it.
- **Training Engine** — a pure, fully-tested core (`generateDailyProtocol(date, userState)`) with 5-phase periodization, duration scaling (0.6× taper → 1.15× peak), automatic intensity reduction (fatigue > 7 or sleep < 6h), reset/deload-week triggers (3+ missed days in 5, avg fatigue ≥ 7.5, avg mood ≤ 2), injury-aware session swaps, fixed-day Life Systems, a hard 3-Big-Rocks/day cap, condition-triggered mindset work, and fueling that scales with the session.
- **Fitness Log** — every session carries a required *feeling* note; weekly/monthly volume, streaks, achievement unlocks. Integration layer (Apple Health / GPS) is pluggable and stubbed.
- **Missions** — auto-generated + manual + recurring tasks across Fitness / Mindset / Knowledge / Social / Business / Money.
- **Journal** — mood tracking, structured prompts from the engine, voice notes (Web Speech, pluggable for Whisper), full-text search; entries feed the coach's memory.
- **Books** — progress bars, notes/quotes/takeaways (takeaways become coach memories), ratings.
- **AI Coach** — text + voice chat with your full context: profile, phase, today's protocol, recent logs, journal, books, big rocks, and a durable long-term memory with honest timestamps ("3 weeks ago you said…"). Adjusts the plan from plain language ("I'm wrecked") and generates tasks via strict-JSON parsed defensively. Runs against the Anthropic API when a key is present, or a deterministic **mock coach** keyless — every feature works either way.
- **Roadmap & Budget Reactor** — clickable milestones toward race day + a $6,950 funding thermometer (editable, +/- and max controls).
- **Analytics** — power-level gauge, acute:chronic load ratio, weekly volume, race-day projection, badges, shareable progress card.
- **Yearbook** — calendar heatmap, merged timeline, and a month-by-month flipbook. Proof of becoming.

## Stack

npm-workspaces monorepo, TypeScript end to end:

| Package | What | Tech |
|---|---|---|
| `@vantage/engine` | Pure training engine + CLI | zero-dependency TS, Vitest |
| `@vantage/server` | API + persistence + coach | Fastify 5, better-sqlite3 (WAL), Anthropic SDK |
| `@vantage/web` | Command-center UI | Vite 7, React 18, React Router, TanStack Query, hand-rolled SVG charts |

Storage is local SQLite (`data/vantage.db`) behind a thin repo layer — swappable for Supabase/Firebase later. Single-user v1, multi-user-ready schema.

## Quick start

```bash
npm install
cp .env.example .env        # optional: add ANTHROPIC_API_KEY for the live coach
npm run seed                # demo data anchored to today (idempotent; --reset to purge)
npm run start               # build web + serve everything at http://localhost:3001
```

Development (two terminals, hot reload):

```bash
npm run dev:server          # Fastify on :3001
npm run dev:web             # Vite on :5173 (proxies /api)
```

## Engine CLI

```bash
npm run engine -- --date 2026-08-15            # markdown protocol for any date
npm run engine -- --date 2026-08-15 --json     # structured object
npm run engine -- --week                        # 7 days from today
npm run engine -- --state '{"recentFatigue":8.5}'   # see the deload fire
npm run engine -- --help
```

## Tests & checks

```bash
npm test            # engine adaptive logic + reset triggers, coach JSON hardening
npm run typecheck   # strict TS across all packages
```

## Configuration

| Where | What |
|---|---|
| `.env` | `ANTHROPIC_API_KEY` (live coach), `PORT`, `VANTAGE_DB_PATH` |
| Settings page | `RACE_DATE`, `PROGRAM_START` (phases re-time proportionally), accent theme |
| `packages/server/src/coach/anthropic.ts` | `COACH_MODEL` — the single model-id constant |

No key? The coach badge shows **mock mode** and everything — streaming chat, memory extraction, JSON task generation, plan adjustment — still works deterministically. Voice uses the browser's Web Speech API (zero keys) behind a pluggable provider interface; unsupported browsers degrade to a disabled mic with an explanation.

## Philosophy (baked into the copy, the coach, and the UX)

Systems over goals · Consistency over intensity · Identity over motivation · Integration over isolation.
