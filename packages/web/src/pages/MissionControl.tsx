import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard, useTaskMutations, useTasks, useUpsertLog } from '../api/queries.ts'
import { Card, ErrorNote, PhaseBadge, ProgressBar, SkeletonCard, StatTile } from '../components/ui.tsx'
import { ProtocolView } from '../components/ProtocolView.tsx'

function greeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'
}

/** "Start Today" walkthrough: log state → review protocol → confirm rocks. */
function StartToday({ date, onClose }: { date: string; onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [sleep, setSleep] = useState(7.5)
  const [mood, setMood] = useState(7)
  const [fatigue, setFatigue] = useState(4)
  const upsert = useUpsertLog()
  const { materialize } = useTaskMutations()

  const steps = [
    <div key="state">
      <h3>1 · Morning readings</h3>
      <label className="field">
        Sleep last night: <b className="mono">{sleep}h</b>
        <input type="range" min={3} max={11} step={0.5} value={sleep} onChange={(e) => setSleep(Number(e.target.value))} />
      </label>
      <label className="field">
        Mood: <b className="mono">{mood}/10</b>
        <input type="range" min={1} max={10} value={mood} onChange={(e) => setMood(Number(e.target.value))} />
      </label>
      <label className="field">
        Fatigue: <b className="mono">{fatigue}/10</b>
        <input type="range" min={1} max={10} value={fatigue} onChange={(e) => setFatigue(Number(e.target.value))} />
      </label>
      <button
        className="primary"
        disabled={upsert.isPending}
        onClick={() =>
          upsert.mutate(
            { date, sleepHours: sleep, mood, fatigue },
            { onSuccess: () => setStep(1) },
          )
        }
      >
        {upsert.isPending ? 'Saving…' : 'Log it → engine adapts'}
      </button>
    </div>,
    <div key="protocol">
      <h3>2 · Protocol regenerated from your real state</h3>
      <p className="muted">The plan below already reflects this morning’s readings. Scroll it, own it.</p>
      <button className="primary" onClick={() => setStep(2)}>
        Got it
      </button>
    </div>,
    <div key="rocks">
      <h3>3 · Lock today’s missions</h3>
      <p className="muted">Generate today’s Big Rocks + Life Systems (max 3 rocks — never overwhelmed).</p>
      <button
        className="primary"
        disabled={materialize.isPending}
        onClick={() => materialize.mutate(undefined, { onSuccess: onClose })}
      >
        {materialize.isPending ? 'Generating…' : 'Generate & start the day'}
      </button>
    </div>,
  ]

  return (
    <Card glow>
      <div className="row between">
        <span className="badge">START TODAY</span>
        <button className="ghost small" onClick={onClose}>
          ✕
        </button>
      </div>
      {steps[step]}
    </Card>
  )
}

export function MissionControl() {
  const { data, isLoading, error, refetch, isRefetching } = useDashboard()
  const { data: tasks } = useTasks()
  const { update } = useTaskMutations()
  const [walkthrough, setWalkthrough] = useState(false)

  if (isLoading)
    return (
      <div className="page">
        <SkeletonCard lines={2} />
        <div className="grid cols-4" style={{ marginTop: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <SkeletonCard lines={6} />
        </div>
      </div>
    )
  if (error || !data) return <ErrorNote error={error ?? 'no data'} />

  const rocks = (tasks ?? []).filter((t) => t.big_rock === 1)

  return (
    <div className="page">
      <div className="row between wrap">
        <div>
          <h1>
            {greeting()}, {data.name.split(' ')[0]}.
          </h1>
          <div className="row wrap" style={{ marginBottom: 8 }}>
            <span className="mono muted">
              Day <b style={{ color: 'var(--accent)' }}>{data.dayNumber}</b> / {data.totalDays} —{' '}
              <b style={{ color: 'var(--accent)' }}>{data.daysToRace}</b> days to {data.raceName}
            </span>
            <PhaseBadge phase={data.phase} />
          </div>
        </div>
        <div className="row">
          <button className="ghost" onClick={() => refetch()} title="Pull fresh state">
            {isRefetching ? '…' : '⟳'}
          </button>
          {!walkthrough && (
            <button className="primary" onClick={() => setWalkthrough(true)}>
              ▶ Start Today
            </button>
          )}
        </div>
      </div>

      <ProgressBar pct={(data.dayNumber / data.totalDays) * 100} />

      {walkthrough && (
        <div style={{ marginTop: 16 }}>
          <StartToday date={data.date} onClose={() => setWalkthrough(false)} />
        </div>
      )}

      <div className="grid cols-4" style={{ margin: '16px 0' }}>
        <StatTile label="Current streak" value={<>{data.streak}<span className="muted" style={{ fontSize: '1rem' }}>d</span></>} accent />
        <StatTile label="Today’s tasks" value={`${data.tasksDone}/${data.tasksTotal}`} />
        <StatTile label="Active books" value={data.activeBooks} />
        <StatTile
          label="Week volume"
          value={`${Math.floor(data.weekVolume.minutes / 60)}h${String(data.weekVolume.minutes % 60).padStart(2, '0')}`}
          sub={`${data.weekVolume.km} km · ${data.weekVolume.sessions} sessions`}
        />
      </div>

      {rocks.length > 0 && (
        <Card>
          <h2>Big Rocks</h2>
          <ul className="clean">
            {rocks.map((t) => (
              <li key={t.id} className="row">
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={t.completed === 1}
                  onChange={() => update.mutate({ id: t.id, completed: t.completed !== 1 })}
                />
                <span style={{ textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.5 : 1 }}>
                  <b className={`cat-${t.category}`}>[{t.category}]</b> {t.title}
                </span>
              </li>
            ))}
          </ul>
          <Link to="/tasks" className="tiny">
            all missions →
          </Link>
        </Card>
      )}

      <div style={{ marginTop: 16 }}>
        <ProtocolView protocol={data.protocol} />
      </div>
    </div>
  )
}
