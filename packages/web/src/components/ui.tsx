import type { CSSProperties, ReactNode } from 'react'
import type { PhaseInfo } from '@vantage/engine'

export function Card({ children, glow, style, className = '' }: { children: ReactNode; glow?: boolean; style?: CSSProperties; className?: string }) {
  return (
    <section className={`card ${glow ? 'glow' : ''} ${className}`} style={style}>
      {children}
    </section>
  )
}

export function StatTile({ label, value, accent, sub }: { label: string; value: ReactNode; accent?: boolean; sub?: string }) {
  return (
    <div className="card stat-tile">
      <div className="value">{accent ? <em>{value}</em> : value}</div>
      <div className="label">{label}</div>
      {sub && <div className="tiny">{sub}</div>}
    </div>
  )
}

export function ProgressBar({ pct, thick }: { pct: number; thick?: boolean }) {
  return (
    <div className={`bar ${thick ? 'thick' : ''}`}>
      <i style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }} />
    </div>
  )
}

export function Skeleton({ h = 14, w = '100%', style }: { h?: number; w?: number | string; style?: CSSProperties }) {
  return <div className="skeleton" style={{ height: h, width: w, ...style }} />
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} h={14} w={`${90 - i * 18}%`} style={{ marginBottom: 10 }} />
      ))}
    </div>
  )
}

export function PhaseBadge({ phase }: { phase: PhaseInfo }) {
  return (
    <span className="badge">
      {phase.id} · {phase.name} · wk {phase.weekOfPhase}/{phase.totalWeeks}
    </span>
  )
}

export function ErrorNote({ error }: { error: unknown }) {
  return (
    <div className="card" style={{ borderColor: 'var(--danger)' }}>
      <b style={{ color: 'var(--danger)' }}>Something broke:</b>{' '}
      <span className="muted">{error instanceof Error ? error.message : String(error)}</span>
    </div>
  )
}
