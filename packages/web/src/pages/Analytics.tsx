import { useAchievements, useLoad, usePowerLevel, useProjection, useShareCard, useVolume } from '../api/queries.ts'
import { Card, SkeletonCard } from '../components/ui.tsx'
import { BarChart, LineChart, PowerMeter } from '../components/charts.tsx'

const fmtHM = (min: number | null) => (min === null ? '—' : `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`)

export function Analytics() {
  const { data: volume } = useVolume(12)
  const { data: load } = useLoad()
  const { data: power } = usePowerLevel()
  const { data: projection } = useProjection()
  const { data: achievements } = useAchievements()
  const { data: card } = useShareCard()

  return (
    <div className="page">
      <h1>Progress & Analytics</h1>

      <div className="grid cols-2">
        <Card glow>
          {power ? <PowerMeter score={power.score} /> : <SkeletonCard lines={3} />}
          {power && (
            <div className="row wrap" style={{ justifyContent: 'center' }}>
              {Object.entries(power.components).map(([k, v]) => (
                <span key={k} className="chip mono" title={k}>
                  {k} {v}
                </span>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h2>Training load</h2>
          {load ? (
            <>
              <LineChart points={load.series} />
              <div className="row wrap mono tiny">
                <span>acute 7d: {load.acute}</span>
                <span>chronic wk: {load.chronicWeekly}</span>
                <span style={{ color: load.ratio > 1.4 ? 'var(--danger)' : load.ratio < 0.8 ? 'var(--warn)' : 'var(--success)' }}>
                  ramp ratio: {load.ratio} {load.ratio > 1.4 ? '⚠ hot' : load.ratio < 0.8 ? '(detraining?)' : '✓'}
                </span>
              </div>
            </>
          ) : (
            <SkeletonCard lines={3} />
          )}
        </Card>
      </div>

      <Card style={{ marginTop: 16 }}>
        <h2>Weekly volume</h2>
        <BarChart buckets={volume ?? []} />
      </Card>

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <Card>
          <h2>Race-day projection</h2>
          {projection && (
            <>
              <table className="mono" style={{ width: '100%', fontSize: '0.9rem' }}>
                <tbody>
                  <tr><td>Swim 2.4 mi</td><td style={{ textAlign: 'right' }}>{fmtHM(projection.swimMin)}</td></tr>
                  <tr><td>Bike 112 mi</td><td style={{ textAlign: 'right' }}>{fmtHM(projection.bikeMin)}</td></tr>
                  <tr><td>Run 26.2 mi</td><td style={{ textAlign: 'right' }}>{fmtHM(projection.runMin)}</td></tr>
                  <tr><td>Transitions</td><td style={{ textAlign: 'right' }}>{fmtHM(projection.transitionsMin)}</td></tr>
                  <tr style={{ color: 'var(--accent)' }}><td><b>Projected finish</b></td><td style={{ textAlign: 'right' }}><b>{fmtHM(projection.totalMin)}</b></td></tr>
                </tbody>
              </table>
              <p className="tiny">{projection.note}</p>
            </>
          )}
        </Card>
        <Card>
          <h2>Share card</h2>
          {card && (
            <div className="card glow" style={{ textAlign: 'center', background: 'var(--bg-1)' }}>
              <div className="mono tiny" style={{ letterSpacing: '0.2em' }}>{String(card.title)}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', fontWeight: 800, color: 'var(--accent)', textShadow: 'var(--accent-glow)' }}>
                {String(card.powerLevel)}
              </div>
              <div className="tiny">POWER LEVEL</div>
              <hr className="divider" />
              <div className="row" style={{ justifyContent: 'center' }}>
                <span className="mono tiny">{String(card.fourWeekHours)}h / 4wk</span>
                <span className="mono tiny">{String(card.fourWeekKm)}km / 4wk</span>
                <span className="mono tiny">{(card.lifetime as { sessions: number })?.sessions} sessions all-time</span>
              </div>
              <button
                className="small"
                style={{ marginTop: 10 }}
                onClick={() => navigator.clipboard?.writeText(JSON.stringify(card, null, 2)).catch(() => {})}
              >
                ⧉ copy card data
              </button>
            </div>
          )}
        </Card>
      </div>

      <Card style={{ marginTop: 16 }}>
        <h2>Achievements</h2>
        <div className="grid cols-4">
          {(achievements ?? []).map((a) => (
            <div key={a.code} className="card" style={{ textAlign: 'center', opacity: a.unlocked_at ? 1 : 0.32, borderColor: a.unlocked_at ? 'var(--accent)' : undefined }} title={a.description ?? ''}>
              <div style={{ fontSize: '1.6rem' }}>{a.icon}</div>
              <b style={{ fontSize: '0.82rem' }}>{a.title}</b>
              <div className="tiny">{a.unlocked_at ? a.unlocked_at.slice(0, 10) : 'locked'}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
