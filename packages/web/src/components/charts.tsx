import type { HeatmapDay, VolumeBucket } from '../api/types.ts'

/** Hand-rolled SVG charts — no chart library, full control of the aesthetic. */

export function BarChart({ buckets, height = 140 }: { buckets: VolumeBucket[]; height?: number }) {
  if (buckets.length === 0) return <div className="muted">No volume yet.</div>
  const max = Math.max(...buckets.map((b) => b.minutes), 1)
  const bw = 100 / buckets.length
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      {buckets.map((b, i) => {
        const h = (b.minutes / max) * (height - 26)
        return (
          <g key={b.start}>
            <rect
              x={i * bw + bw * 0.15}
              y={height - 18 - h}
              width={bw * 0.7}
              height={Math.max(h, 1)}
              rx={1.5}
              fill={i === buckets.length - 1 ? 'var(--accent)' : 'var(--accent-soft)'}
              stroke="var(--accent)"
              strokeWidth={0.3}
            >
              <title>{`${b.start} — ${Math.round(b.minutes / 60)}h ${b.minutes % 60}m · ${b.km}km · ${b.sessions} sessions`}</title>
            </rect>
            <text x={i * bw + bw / 2} y={height - 6} textAnchor="middle" fontSize={4.2} fill="var(--text-lo)">
              {b.start.slice(5)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function LineChart({ points, height = 120 }: { points: Array<{ date: string; load: number }>; height?: number }) {
  if (points.length < 2) return <div className="muted">Not enough data yet.</div>
  const max = Math.max(...points.map((p) => p.load), 1)
  const coords = points.map((p, i) => `${(i / (points.length - 1)) * 100},${height - 14 - (p.load / max) * (height - 24)}`)
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <polyline points={coords.join(' ')} fill="none" stroke="var(--accent)" strokeWidth={1.2} />
      <polygon
        points={`0,${height - 14} ${coords.join(' ')} 100,${height - 14}`}
        fill="var(--accent-soft)"
        opacity={0.6}
      />
      <text x={1} y={9} fontSize={4.5} fill="var(--text-lo)" fontFamily="var(--font-mono)">
        7-day rolling load (min × effort)
      </text>
    </svg>
  )
}

const LEVEL_COLORS = ['#161c2c', 'rgba(77,201,255,0.25)', 'rgba(77,201,255,0.5)', 'rgba(77,201,255,0.75)', 'var(--accent)']

export function Heatmap({ days, year }: { days: HeatmapDay[]; year: number }) {
  const byDate = new Map(days.map((d) => [d.date, d]))
  const start = new Date(Date.UTC(year, 0, 1))
  const startDow = start.getUTCDay()
  const cells: Array<{ date: string; level: number; minutes: number }> = []
  for (let i = 0; i < 366; i++) {
    const d = new Date(Date.UTC(year, 0, 1 + i))
    if (d.getUTCFullYear() !== year) break
    const iso = d.toISOString().slice(0, 10)
    const hit = byDate.get(iso)
    cells.push({ date: iso, level: hit?.level ?? 0, minutes: hit?.minutes ?? 0 })
  }
  const weeks = Math.ceil((cells.length + startDow) / 7)
  const size = 11
  const gap = 2.5
  return (
    <div className="heatmap-scroll">
      <svg width={weeks * (size + gap) + 24} height={7 * (size + gap) + 18}>
        {cells.map((c, i) => {
          const slot = i + startDow
          const x = Math.floor(slot / 7) * (size + gap) + 22
          const y = (slot % 7) * (size + gap) + 14
          return (
            <rect key={c.date} x={x} y={y} width={size} height={size} rx={2.5} fill={LEVEL_COLORS[c.level]}>
              <title>{`${c.date}: ${c.minutes ? `${c.minutes} min` : 'rest'}`}</title>
            </rect>
          )
        })}
        {['Mon', 'Wed', 'Fri'].map((d, i) => (
          <text key={d} x={0} y={(1 + i * 2) * (size + gap) + 23} fontSize={8} fill="var(--text-lo)">
            {d}
          </text>
        ))}
        {Array.from({ length: 12 }, (_, m) => {
          const firstOfMonth = Math.floor((Date.UTC(year, m, 1) - Date.UTC(year, 0, 1)) / 86_400_000)
          return (
            <text key={m} x={Math.floor((firstOfMonth + startDow) / 7) * (size + gap) + 22} y={9} fontSize={8} fill="var(--text-lo)">
              {new Date(Date.UTC(year, m, 1)).toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

export function PowerMeter({ score }: { score: number }) {
  const angle = (Math.min(score, 100) / 100) * 270 - 225
  const rad = (deg: number) => (deg * Math.PI) / 180
  const arc = (from: number, to: number, r: number) => {
    const x1 = 60 + r * Math.cos(rad(from))
    const y1 = 60 + r * Math.sin(rad(from))
    const x2 = 60 + r * Math.cos(rad(to))
    const y2 = 60 + r * Math.sin(rad(to))
    return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`
  }
  return (
    <svg viewBox="0 0 120 110" style={{ width: '100%', maxWidth: 230, margin: '0 auto', display: 'block' }}>
      <path d={arc(-225, 45, 46)} fill="none" stroke="var(--bg-2)" strokeWidth={9} strokeLinecap="round" />
      <path
        d={arc(-225, angle, 46)}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={9}
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 6px var(--accent))' }}
      />
      <text x={60} y={62} textAnchor="middle" fontSize={26} fontFamily="var(--font-mono)" fontWeight={700} fill="var(--text-hi)">
        {score}
      </text>
      <text x={60} y={78} textAnchor="middle" fontSize={7} letterSpacing={2} fill="var(--text-lo)">
        POWER LEVEL
      </text>
    </svg>
  )
}
