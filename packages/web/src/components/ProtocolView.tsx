import type { DailyProtocol, WorkoutBlock } from '@vantage/engine'
import { Card } from './ui.tsx'

function Block({ w }: { w: WorkoutBlock }) {
  return (
    <div style={{ padding: '10px 0', borderTop: '1px solid var(--glass-border)' }}>
      <div className="row between">
        <b>
          <span className={`dot ${w.discipline}`} style={{ marginRight: 8 }} />
          {w.title}
        </b>
        <span className="chip">{w.primary ? 'PRIMARY' : w.optional ? 'OPTIONAL' : 'SECONDARY'}</span>
      </div>
      <div className="mono muted" style={{ margin: '4px 0' }}>
        {w.durationRange[1] > 0 && (
          <>
            {w.durationRange[0]}–{w.durationRange[1]} min ·{' '}
          </>
        )}
        {w.intensity.toUpperCase()} — {w.effort}
      </div>
      {w.focus.length > 0 && <div className="tiny">Focus: {w.focus.join(' · ')}</div>}
      {w.structure.length > 0 && (
        <ul className="clean tiny" style={{ marginTop: 4 }}>
          {w.structure.map((s) => (
            <li key={s}>— {s}</li>
          ))}
        </ul>
      )}
      {w.modifications.map((m) => (
        <div key={m} className="badge warn" style={{ marginTop: 6 }}>
          ⚠ {m}
        </div>
      ))}
    </div>
  )
}

export function ProtocolView({ protocol, markdown }: { protocol: DailyProtocol; markdown?: string }) {
  return (
    <Card>
      <div className="row between wrap">
        <h2 style={{ margin: 0 }}>Today’s Protocol</h2>
        <div className="row">
          {protocol.flags.map((f) => (
            <span key={f} className={`badge ${f === 'deload' || f === 'intensity_reduced' ? 'warn' : f === 'injury_modified' ? 'danger' : ''}`}>
              {f.replace('_', ' ')}
            </span>
          ))}
          {markdown && (
            <button
              className="small ghost"
              onClick={() => {
                navigator.clipboard?.writeText(markdown).catch(() => {})
              }}
              title="Copy protocol as markdown"
            >
              ⧉ copy .md
            </button>
          )}
        </div>
      </div>
      <p className="muted" style={{ marginTop: 4 }}>
        <b style={{ color: 'var(--text-hi)' }}>Mission:</b> {protocol.mission}
      </p>
      {protocol.workouts.map((w, i) => (
        <Block key={`${w.title}-${i}`} w={w} />
      ))}
      <hr className="divider" />
      <div className="grid cols-2">
        <div>
          <h3>
            Mindset — {protocol.mindset.title} <span className="tiny">({protocol.mindset.durationMin} min)</span>
          </h3>
          <p className="muted" style={{ fontSize: '0.85rem' }}>{protocol.mindset.prompt}</p>
        </div>
        <div>
          <h3>Fueling {protocol.nutrition.raceFuelPractice && <span className="badge">race practice</span>}</h3>
          <ul className="clean tiny">
            {protocol.nutrition.guidance.map((g) => (
              <li key={g}>— {g}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}
