import { useMemo, useState } from 'react'
import { useYearbook } from '../api/queries.ts'
import { Card, SkeletonCard, StatTile } from '../components/ui.tsx'
import { Heatmap } from '../components/charts.tsx'

const KIND_ICON: Record<string, string> = { workout: '⏱', milestone: '⚑', journal: '✎', book: '▤', achievement: '🏅' }
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function Yearbook() {
  const [year, setYear] = useState(new Date().getFullYear())
  const { data, isLoading } = useYearbook(year)
  const [month, setMonth] = useState(new Date().getMonth())
  const [turning, setTurning] = useState(false)

  const monthEvents = useMemo(
    () => (data?.events ?? []).filter((e) => Number(e.date.slice(5, 7)) === month + 1),
    [data, month],
  )

  const flip = (dir: number) => {
    setTurning(true)
    setTimeout(() => {
      setMonth((m) => (m + dir + 12) % 12)
      setTurning(false)
    }, 250)
  }

  return (
    <div className="page">
      <div className="row between wrap">
        <h1>Life Archive — {year}</h1>
        <div className="row">
          <button onClick={() => setYear(year - 1)}>←</button>
          <span className="mono">{year}</span>
          <button onClick={() => setYear(year + 1)}>→</button>
        </div>
      </div>
      <p className="muted">Proof of becoming. Every session, reflection, finished book and unlocked badge — one year, one record.</p>

      {isLoading && <SkeletonCard lines={6} />}
      {data && (
        <>
          <div className="grid cols-3" style={{ marginBottom: 16 }}>
            <StatTile label="Workouts" value={data.stats.workouts} accent />
            <StatTile label="Hours trained" value={data.stats.hours} />
            <StatTile label="Distance" value={`${data.stats.km}km`} />
            <StatTile label="Reflections" value={data.stats.journalEntries} />
            <StatTile label="Books finished" value={data.stats.booksFinished} />
            <StatTile label="Milestones" value={data.stats.milestones} />
          </div>

          <Card>
            <h2>The year, day by day</h2>
            <Heatmap days={data.heatmap} year={year} />
          </Card>

          <Card style={{ marginTop: 16 }}>
            <div className="row between">
              <h2>Flipbook</h2>
              <div className="row">
                <button onClick={() => flip(-1)}>‹</button>
                <span className="mono" style={{ width: 110, textAlign: 'center' }}>{MONTHS[month]}</span>
                <button onClick={() => flip(1)}>›</button>
              </div>
            </div>
            <div className="flipbook">
              <div className={`flip-page ${turning ? 'turning' : ''}`}>
                {monthEvents.length === 0 && <p className="muted">Quiet month — or one not yet lived.</p>}
                <ul className="clean">
                  {monthEvents.map((e, i) => (
                    <li key={`${e.date}-${i}`} style={{ borderTop: '1px solid var(--glass-border)' }}>
                      <span className="mono tiny" style={{ marginRight: 10 }}>{e.date.slice(5)}</span>
                      <span style={{ marginRight: 8 }}>{KIND_ICON[e.kind]}</span>
                      <b style={{ color: e.kind === 'milestone' || e.kind === 'achievement' ? 'var(--accent)' : 'inherit' }}>{e.title}</b>
                      {e.detail && <span className="tiny"> — {e.detail}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
