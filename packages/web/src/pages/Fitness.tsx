import { useState, type FormEvent } from 'react'
import { useCreateWorkout, useDeleteWorkout, useVolume, useWorkouts, useDashboard } from '../api/queries.ts'
import { Card, ErrorNote, SkeletonCard, StatTile } from '../components/ui.tsx'
import { BarChart } from '../components/charts.tsx'

const TYPES = ['run', 'swim', 'bike', 'strength', 'brick', 'mobility', 'other']

function WorkoutForm() {
  const create = useCreateWorkout()
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'run',
    title: '',
    durationMin: 45,
    distanceKm: '',
    effort: 5,
    feeling: '',
    notes: '',
  })
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate(
      {
        ...form,
        title: form.title || undefined,
        distanceKm: form.distanceKm === '' ? undefined : Number(form.distanceKm),
        notes: form.notes || undefined,
      },
      { onSuccess: () => set('feeling', '') },
    )
  }

  return (
    <Card>
      <h2>Log a session</h2>
      <form onSubmit={submit}>
        <div className="grid cols-3">
          <label className="field">
            Date
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
          </label>
          <label className="field">
            Type
            <select value={form.type} onChange={(e) => set('type', e.target.value)}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Title (optional)
            <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Aerobic Long Run" />
          </label>
          <label className="field">
            Duration (min)
            <input type="number" min={1} value={form.durationMin} onChange={(e) => set('durationMin', Number(e.target.value))} required />
          </label>
          <label className="field">
            Distance (km)
            <input type="number" step="0.1" min={0} value={form.distanceKm} onChange={(e) => set('distanceKm', e.target.value)} />
          </label>
          <label className="field">
            Effort {form.effort}/10
            <input type="range" min={1} max={10} value={form.effort} onChange={(e) => set('effort', Number(e.target.value))} />
          </label>
        </div>
        <label className="field">
          How did it feel? <span style={{ color: 'var(--accent)' }}>(required — this is data the coach uses)</span>
          <input
            value={form.feeling}
            onChange={(e) => set('feeling', e.target.value)}
            placeholder='“Felt strong” · “Pushed past a mental wall” · “Legs empty, showed up anyway”'
            required
          />
        </label>
        <label className="field">
          Notes
          <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </label>
        <button className="primary" disabled={create.isPending}>
          {create.isPending ? 'Saving…' : 'Log workout'}
        </button>
        {create.error && <span className="tiny" style={{ color: 'var(--danger)', marginLeft: 10 }}>{(create.error as Error).message}</span>}
      </form>
      <p className="tiny" style={{ marginTop: 10 }}>
        Integrations (Apple Health / Google Fit / GPS) are stubbed behind a pluggable layer — manual logging is the v1 source of truth.
      </p>
    </Card>
  )
}

export function Fitness() {
  const { data: workouts, isLoading, error } = useWorkouts('?limit=60')
  const { data: volume } = useVolume(12)
  const { data: dash } = useDashboard()
  const remove = useDeleteWorkout()

  return (
    <div className="page">
      <h1>Fitness Log</h1>
      <div className="grid cols-3" style={{ marginBottom: 16 }}>
        <StatTile label="Streak" value={`${dash?.streak ?? '—'}d`} accent />
        <StatTile label="This week" value={`${Math.round((dash?.weekVolume.minutes ?? 0) / 60)}h`} sub={`${dash?.weekVolume.km ?? 0} km`} />
        <StatTile label="Sessions (7d)" value={dash?.weekVolume.sessions ?? '—'} />
      </div>

      <Card>
        <h2>Weekly volume — last 12 weeks</h2>
        <BarChart buckets={volume ?? []} />
      </Card>

      <div style={{ marginTop: 16 }}>
        <WorkoutForm />
      </div>

      <Card style={{ marginTop: 16 }}>
        <h2>History</h2>
        {isLoading && <SkeletonCard lines={5} />}
        {error && <ErrorNote error={error} />}
        <ul className="clean">
          {(workouts ?? []).map((w) => (
            <li key={w.id} style={{ borderTop: '1px solid var(--glass-border)', padding: '9px 0' }}>
              <div className="row between wrap">
                <span>
                  <span className={`dot ${w.type}`} style={{ marginRight: 8 }} />
                  <b className="mono">{w.date}</b> · {w.title ?? w.type}
                </span>
                <span className="row">
                  <span className="mono muted">
                    {Math.round(w.duration_min)}min{w.distance_km ? ` · ${w.distance_km}km` : ''}
                    {w.effort ? ` · E${w.effort}` : ''}
                  </span>
                  <button className="ghost small" title="Delete" onClick={() => remove.mutate(w.id)}>
                    ✕
                  </button>
                </span>
              </div>
              <div className="tiny" style={{ fontStyle: 'italic' }}>“{w.feeling}”</div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
