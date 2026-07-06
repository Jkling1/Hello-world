# Voice AI Coach — Product & Technical Specification

## 1. Overview & Goals

The AI Coach is the conversational core of Vantage / Project IronMind. Today it
answers questions and gives advice using the athlete's full context (profile,
training phase, recent logs, journal, books, big rocks, long-term memory). That
is necessary but not sufficient: an athlete talking to a coach out loud expects
the coach to *act* on what they say, not just respond to it.

This spec defines the Coach as a **write-capable agent**: a conversational
interface backed by a function-calling layer that can create and modify the
athlete's actual data — workouts, meals, daily metrics, plan adjustments, and
checklist items — directly from natural speech, with every write confirmed,
logged, and reversible.

Non-goals: this spec does not cover authentication, multi-user support, or
third-party integration writes (e.g. pushing workouts to Strava). Those are
out of scope for v1.

## 2. Personas & Core Scenarios

Primary persona: a single athlete training for a fixed goal race, talking to
the coach hands-free (post-workout, driving, cooking) or via text.

Representative utterances this spec must support end-to-end:

| Utterance | Expected effect |
|---|---|
| "I did a 40-mile ride, felt good, HR in the 140s." | A workout is logged with distance, subjective feel, and HR range. |
| "For breakfast I had oatmeal, a banana, and three eggs." | A meal is logged with estimated macros. |
| "Slept six hours, feeling beat, mood's a 7." | Today's daily metrics (sleep, fatigue, mood) are recorded and feed the deload engine. |
| "Swap tomorrow's run for a swim, knee's cranky." | Tomorrow's session is swapped via the training engine, with the reason noted. |
| "Check off book race-week lodging." | The named checklist item is marked complete. |

## 3. Voice Interface

- **Input**: browser Web Speech API (or equivalent STT) for capture, streamed
  to the Coach as text once an utterance is finalized. Provider is behind a
  pluggable interface so a hosted STT (e.g. Whisper) can replace it without
  touching the Coach logic.
- **Output**: responses are spoken via TTS and shown as chat text
  simultaneously, so the interaction works with the mic muted or with sound
  off.
- **Degradation**: unsupported browsers disable the mic with an inline
  explanation; the rest of the Coach (text chat, writes) is unaffected.
- **Turn-taking**: the interface is push-to-talk for v1 (not full-duplex);
  continuous "always listening" mode is a future extension, not required
  here.

## 4. Conversational Layer (Read Path)

Unchanged from the existing Coach: every turn is built with the athlete's
profile, current phase, recent logs, journal entries, book notes, big rocks,
and long-term memory, then answered in plain language. This spec does not
change the read path — it adds a write path alongside it.

## 5. Data Model

### 5.1 Existing entities referenced

- `Workout` — session log (type, duration/distance, feel note, HR data).
- `DailyMetrics` — per-day sleep, fatigue, mood, used by the deload/reset
  triggers in the training engine.
- `ChecklistItem` — a named, completable task (e.g. race-week logistics).
- `Plan` / `Session` — the generated daily protocol the training engine
  produces; sessions can be swapped or annotated.

### 5.2 New entity: `NutritionLog`

There was previously no place to persist food. This spec adds:

```
NutritionLog {
  id: string
  loggedAt: datetime
  rawText: string            // "oatmeal, a banana, and three eggs"
  items: NutritionItem[]     // parsed items, one per food mentioned
  estimatedCalories: number  // sum across items
  estimatedMacros: { proteinG: number, carbsG: number, fatG: number }
  source: "voice" | "text"
  confidence: "estimated"    // always estimated, never claimed exact
}

NutritionItem {
  name: string
  quantity: string           // free-text quantity as spoken, e.g. "1 banana"
  estimatedCalories: number
  estimatedMacros: { proteinG: number, carbsG: number, fatG: number }
}
```

Macro/calorie estimates come from the Coach's model call (constrained JSON),
not a nutrition database lookup, and are always labeled as estimates in the
UI — no false precision.

### 5.3 New entity: `CoachAction` (audit log)

Every write the Coach makes is recorded, independent of the domain record it
created or changed:

```
CoachAction {
  id: string
  createdAt: datetime
  tool: string               // e.g. "log_workout"
  utterance: string           // the triggering user text
  input: object                // arguments the model produced
  result: "applied" | "undone" | "failed"
  targetType: string           // "Workout" | "NutritionLog" | ...
  targetId: string
  confirmationText: string     // what the Coach said back to the athlete
}
```

This is what makes "everything the Coach changed" inspectable and undoable —
it is the single source of truth for the write path, separate from and in
addition to the domain tables it touches.

## 6. Safety Model

- **No silent writes.** Every tool call results in a spoken/written
  confirmation before or immediately after the write ("Logged a 40-mile ride,
  feeling good, HR 140s — anything to add?").
- **Undo, not edit-in-place.** Reversing a Coach action deletes/reverts the
  record and marks the `CoachAction` as `"undone"`; it does not silently
  mutate history.
- **Ambiguity → clarify, don't guess.** If a tool's required fields can't be
  extracted confidently (e.g. "log a workout" with no detail), the Coach asks
  a follow-up instead of calling the tool with placeholder data.
- **Scope limits.** Tools only ever touch the current athlete's own records.
  No tool exists for deleting historical data outright — only the specific
  record just created via undo.

## 7. Write-Capable Agent Tools (Function-Calling Layer)

The Coach is given a fixed set of tools it may call in response to a turn.
The model chooses zero or one tool per turn (multiple distinct asks in one
utterance may be handled as sequential tool calls within the same turn). Every
tool call is followed by a plain-language confirmation and a `CoachAction`
record.

### 7.1 `log_workout`

- **Triggers on**: descriptions of completed training sessions.
- **Input**: session type, duration and/or distance, subjective feel, optional
  HR range/avg, optional notes.
- **Effect**: creates a `Workout` record for today (or the date mentioned).
- **Confirmation**: restates type, distance/duration, and feel.
- **Example**: *"I did a 40-mile ride, felt good, HR in the 140s"* → Workout
  {type: ride, distance: 40mi, feel: good, hrRange: "140s"}.

### 7.2 `log_meal`

- **Triggers on**: descriptions of food eaten.
- **Input**: free-text list of foods, meal label if stated (breakfast/lunch/
  dinner/snack), otherwise inferred from time of day.
- **Effect**: creates a `NutritionLog` (§5.2), with the model estimating
  per-item and total calories/macros in the same tool call.
- **Confirmation**: restates the items and the estimated total, flagged as an
  estimate.
- **Example**: *"For breakfast I had oatmeal, a banana, and three eggs"* →
  NutritionLog with 3 items, breakfast, estimated ~550 kcal.

### 7.3 `log_daily_metrics`

- **Triggers on**: statements about sleep, fatigue/energy, or mood.
- **Input**: any subset of {sleepHours, fatigue (1–10), mood (1–10)}, filling
  only what was said — this tool must support partial updates.
- **Effect**: upserts today's `DailyMetrics`, which is what the training
  engine's deload/reset triggers read from directly. A metrics write here can
  immediately change tomorrow's generated protocol.
- **Confirmation**: restates what was recorded and, if a deload/reset trigger
  fired as a result, says so explicitly.
- **Example**: *"Slept six hours, feeling beat, mood's a 7"* →
  DailyMetrics{sleepHours: 6, fatigue: 8 (inferred from "beat"), mood: 7}.

### 7.4 `adjust_plan`

- **Triggers on**: requests to change an upcoming session or the reason
  behind a change (injury, schedule conflict, etc.).
- **Input**: target date (defaults to next matching session), replacement
  session type or "skip", reason.
- **Effect**: calls into the training engine to swap/annotate the session
  rather than editing the plan directly, so injury-aware swap logic and
  fueling recalculation stay consistent with engine-generated days.
- **Confirmation**: restates the swap and the reason recorded.
- **Example**: *"Swap tomorrow's run for a swim, knee's cranky"* → tomorrow's
  session becomes a swim, reason: "knee".

### 7.5 `toggle_checklist_item`

- **Triggers on**: marking a named task/checklist item done or not done.
- **Input**: item name (fuzzy-matched against open `ChecklistItem`s), target
  state (defaults to "complete").
- **Effect**: toggles the matched `ChecklistItem`. If no confident match is
  found, the Coach lists close candidates and asks which one, rather than
  creating a new item or guessing.
- **Confirmation**: restates the item and its new state.
- **Example**: *"Check off book race-week lodging"* → ChecklistItem "Book
  race-week lodging" → complete.

## 8. Definition of Done

- [ ] `NutritionLog` and `CoachAction` entities exist in the schema with
      migrations.
- [ ] All five tools in §7 are implemented behind the function-calling layer
      and covered by tests exercising the example utterance for each.
- [ ] Every successful tool call produces exactly one `CoachAction` record
      and one plain-language confirmation.
- [ ] `log_daily_metrics` writes are visible to the training engine's
      deload/reset trigger logic without requiring a separate sync step.
- [ ] `adjust_plan` goes through the training engine (not a direct plan
      edit), preserving injury-aware swap and fueling logic.
- [ ] Ambiguous or underspecified utterances produce a clarifying question
      instead of a tool call with guessed fields.
- [ ] Every applied `CoachAction` can be undone, and undoing it updates the
      `CoachAction.result` to `"undone"` and reverts the domain record.
- [ ] Works in both voice and text input modes, and in both live-API and
      keyless mock-coach modes.
