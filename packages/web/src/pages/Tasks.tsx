import { useState, type FormEvent } from 'react'
import { useLifeSystemMutations, useLifeSystems, useTaskMutations, useTasks } from '../api/queries.ts'
import { Card, ErrorNote, SkeletonCard } from '../components/ui.tsx'

const CATEGORIES = ['Fitness', 'Mindset', 'Knowledge', 'Social', 'Business', 'Money']
const CADENCES = ['daily', 'weekly', 'monthly', 'yearly']
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const todayISO = () => new Date().toISOString().slice(0, 10)

export function Tasks() {
  const [date, setDate] = useState(todayISO())
  const { data: tasks, isLoading, error } = useTasks(date)
  const { create, update, remove, materialize } = useTaskMutations()
  const { data: systems } = useLifeSystems()
  const lsm = useLifeSystemMutations()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Fitness')
  const [cadence, setCadence] = useState('daily')
  const [bigRock, setBigRock] = useState(false)

  const rocks = (tasks ?? []).filter((t) => t.big_rock === 1)
  const rest = (tasks ?? []).filter((t) => t.big_rock !== 1)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    create.mutate({ date, title, category, cadence, bigRock }, { onSuccess: () => setTitle('') })
  }

  return (
    <div className="page">
      <div className="row between wrap">
        <h1>Missions</h1>
        <div className="row">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 170 }} />
          <button onClick={() => materialize.mutate(date)} disabled={materialize.isPending}>
            {materialize.isPending ? '…' : '⚙ Generate for this day'}
          </button>
        </div>
      </div>

      {isLoading && <SkeletonCard lines={4} />}
      {error && <ErrorNote error={error} />}

      <Card glow>
        <h2>
          Big Rocks <span className="tiny">({rocks.length}/3 — capped so you’re never overwhelmed)</span>
        </h2>
        {rocks.length === 0 && <p className="muted">No rocks placed. Generate the day or add one below.</p>}
        <ul className="clean">
          {rocks.map((t) => (
            <li key={t.id} className="row between">
              <span className="row">
                <input type="checkbox" style={{ width: 'auto' }} checked={t.completed === 1} onChange={() => update.mutate({ id: t.id, completed: t.completed !== 1 })} />
                <span style={{ textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.5 : 1 }}>
                  <b className={`cat-${t.category}`}>[{t.category}]</b> {t.title}
                </span>
              </span>
              <span className="row">
                <span className="chip">{t.origin}</span>
                <button className="ghost small" onClick={() => remove.mutate(t.id)}>✕</button>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <h2>Tasks & Life Systems</h2>
        <ul className="clean">
          {rest.map((t) => (
            <li key={t.id} className="row between">
              <span className="row">
                <input type="checkbox" style={{ width: 'auto' }} checked={t.completed === 1} onChange={() => update.mutate({ id: t.id, completed: t.completed !== 1 })} />
                <span style={{ textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.5 : 1 }}>
                  <b className={`cat-${t.category}`}>[{t.category}]</b> {t.title}
                </span>
              </span>
              <span className="row">
                <span className="chip">{t.cadence}</span>
                <button className="ghost small" onClick={() => remove.mutate(t.id)}>✕</button>
              </span>
            </li>
          ))}
        </ul>
        <hr className="divider" />
        <form onSubmit={submit} className="row wrap">
          <input style={{ flex: 2, minWidth: 200 }} placeholder="New task…" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select style={{ width: 130 }} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select style={{ width: 110 }} value={cadence} onChange={(e) => setCadence(e.target.value)}>
            {CADENCES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <label className="row tiny" style={{ width: 'auto' }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={bigRock} onChange={(e) => setBigRock(e.target.checked)} />
            Big Rock
          </label>
          <button className="primary" disabled={create.isPending}>Add</button>
        </form>
        {create.error && <div className="tiny" style={{ color: 'var(--danger)', marginTop: 6 }}>{(create.error as Error).message}</div>}
      </Card>

      <Card style={{ marginTop: 16 }}>
        <h2>Life Systems <span className="tiny">recurring, fixed days</span></h2>
        <ul className="clean">
          {(systems ?? []).map((s) => (
            <li key={s.id} className="row between">
              <span>
                <b className={`cat-${s.category}`}>[{s.category}]</b> {s.name}
                <span className="chip" style={{ marginLeft: 8 }}>{s.day_of_week !== null ? DOW[s.day_of_week] : s.cadence}</span>
              </span>
              <span className="row">
                <button className="ghost small" onClick={() => lsm.update.mutate({ id: s.id, active: s.active !== 1 })}>
                  {s.active ? 'active' : 'paused'}
                </button>
                <button className="ghost small" onClick={() => lsm.remove.mutate(s.id)}>✕</button>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
