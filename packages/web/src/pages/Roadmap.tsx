import { useBudget, useBudgetMutations, useMilestones, useToggleMilestone } from '../api/queries.ts'
import { Card, ErrorNote, SkeletonCard } from '../components/ui.tsx'

const fmt = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`

export function Roadmap() {
  const { data: milestones, isLoading, error } = useMilestones()
  const toggle = useToggleMilestone()
  const { data: budget } = useBudget()
  const { update } = useBudgetMutations()

  return (
    <div className="page">
      <h1>Roadmap to Ironman Florida</h1>

      <Card>
        <h2>Milestones</h2>
        <div style={{ position: 'relative', paddingLeft: 22 }}>
          <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: 'var(--glass-border)' }} />
          {isLoading && <SkeletonCard lines={5} />}
          {error && <ErrorNote error={error} />}
          {(milestones ?? []).map((m) => (
            <div key={m.id} className="row" style={{ padding: '10px 0', position: 'relative' }}>
              <button
                className="ghost"
                style={{
                  position: 'absolute',
                  left: -22,
                  width: 18,
                  height: 18,
                  padding: 0,
                  borderRadius: '50%',
                  background: m.completed ? 'var(--accent)' : 'var(--bg-2)',
                  border: `2px solid ${m.completed ? 'var(--accent)' : 'var(--glass-border)'}`,
                  boxShadow: m.completed ? 'var(--accent-glow)' : 'none',
                }}
                title={m.completed ? 'Mark incomplete' : 'Mark complete'}
                onClick={() => toggle.mutate({ id: m.id, completed: m.completed !== 1 })}
              />
              <div style={{ marginLeft: 8 }}>
                <b style={{ textDecoration: 'none', color: m.completed ? 'var(--accent)' : 'var(--text-hi)' }}>
                  {m.title} {m.completed === 1 && '✓'}
                </b>
                <div className="tiny">
                  {m.description}
                  {m.completed === 1 && m.completed_at && ` — done ${m.completed_at.slice(0, 10)}`}
                  {!m.completed && m.target_date && ` — target ${m.target_date}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginTop: 16 }} glow>
        <div className="row between wrap">
          <h2>Budget Reactor</h2>
          {budget && (
            <span className="mono">
              {fmt(budget.totals.spent_cents)} / {fmt(budget.totals.planned_cents)} · <b style={{ color: 'var(--accent)' }}>{budget.totals.pct}%</b>
            </span>
          )}
        </div>
        {budget && (
          <>
            <div className="bar thick" style={{ margin: '8px 0 16px' }}>
              <i style={{ width: `${budget.totals.pct}%` }} />
            </div>
            {budget.items.map((item) => {
              const pct = item.planned_cents > 0 ? Math.round((item.spent_cents / item.planned_cents) * 100) : 0
              return (
                <div key={item.id} style={{ padding: '8px 0', borderTop: '1px solid var(--glass-border)' }}>
                  <div className="row between">
                    <b>{item.label}</b>
                    <span className="mono muted">
                      {fmt(item.spent_cents)} / {fmt(item.planned_cents)} ({pct}%)
                    </span>
                  </div>
                  <div className="row" style={{ marginTop: 6 }}>
                    <div style={{ flex: 1 }} className="bar">
                      <i style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <button className="small" onClick={() => update.mutate({ id: item.id, spentCents: Math.max(item.spent_cents - 5000, 0) })}>−$50</button>
                    <button className="small" onClick={() => update.mutate({ id: item.id, spentCents: item.spent_cents + 5000 })}>+$50</button>
                    <button className="small" onClick={() => update.mutate({ id: item.id, spentCents: item.planned_cents })}>max</button>
                    <button
                      className="small ghost"
                      title="Edit planned amount"
                      onClick={() => {
                        const v = window.prompt(`Planned $ for ${item.label}:`, String(item.planned_cents / 100))
                        if (v !== null && !Number.isNaN(Number(v))) update.mutate({ id: item.id, plannedCents: Math.round(Number(v) * 100) })
                      }}
                    >
                      ✎
                    </button>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </Card>
    </div>
  )
}
