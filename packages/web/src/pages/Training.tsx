import { useState } from 'react'
import { useProtocol } from '../api/queries.ts'
import { ErrorNote, PhaseBadge, SkeletonCard } from '../components/ui.tsx'
import { ProtocolView } from '../components/ProtocolView.tsx'
import { get } from '../api/client.ts'
import { useQuery } from '@tanstack/react-query'
import type { DailyProtocol } from '@vantage/engine'

const todayISO = () => new Date().toISOString().slice(0, 10)

export function Training() {
  const [date, setDate] = useState(todayISO())
  const [weekView, setWeekView] = useState(false)
  const { data, isLoading, error } = useProtocol(date)
  const week = useQuery({
    queryKey: ['week', date],
    queryFn: () => get<{ days: DailyProtocol[] }>(`/api/protocol/week?start=${date}`),
    enabled: weekView,
  })

  return (
    <div className="page">
      <div className="row between wrap">
        <h1>Training Engine</h1>
        <div className="row">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 170 }} />
          <button className={weekView ? '' : 'primary'} onClick={() => setWeekView(false)}>
            Day
          </button>
          <button className={weekView ? 'primary' : ''} onClick={() => setWeekView(true)}>
            Week
          </button>
        </div>
      </div>
      <p className="muted">
        The engine generates this from your periodized plan and your <i>actual</i> recent state — fatigue, sleep, mood,
        adherence, injuries. Log honestly and it adapts.
      </p>

      {!weekView && (
        <>
          {isLoading && <SkeletonCard lines={7} />}
          {error && <ErrorNote error={error} />}
          {data && (
            <>
              <div className="row wrap" style={{ marginBottom: 12 }}>
                <PhaseBadge phase={data.protocol.phase} />
                <span className="mono muted">
                  Day {data.protocol.dayNumber}/{data.protocol.totalDays} · {data.protocol.daysToRace} to race
                </span>
                <span className="mono tiny">
                  state: fatigue {data.state.recentFatigue} · sleep {data.state.recentSleepHours}h · mood {data.state.recentMood} ·
                  adherence {Math.round(data.state.recentAdherence * 100)}%
                </span>
              </div>
              <ProtocolView protocol={data.protocol} markdown={data.markdown} />
            </>
          )}
        </>
      )}

      {weekView && (
        <>
          {week.isLoading && <SkeletonCard lines={7} />}
          {week.data?.days.map((p) => (
            <div key={p.date} className="card" style={{ marginTop: 12 }}>
              <div className="row between wrap">
                <b className="mono">{p.date}</b>
                <span className="tiny">
                  {p.workouts
                    .filter((w) => !w.optional)
                    .map((w) => w.title)
                    .join(' + ')}
                </span>
                <span className="muted mono">
                  {p.workouts.filter((w) => !w.optional).reduce((s, w) => s + w.durationRange[1], 0)} min max
                </span>
              </div>
              {p.flags.length > 0 && <div className="tiny" style={{ color: 'var(--warn)' }}>{p.flags.join(', ')}</div>}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
