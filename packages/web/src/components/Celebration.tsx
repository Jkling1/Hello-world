import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { Achievement } from '../api/types.ts'

const CelebrationContext = createContext<(items: Achievement[]) => void>(() => {})

export const useCelebration = () => useContext(CelebrationContext)

const COLORS = ['var(--accent)', 'var(--success)', 'var(--warn)', 'var(--danger)', '#c79bff']

/** Milestone/achievement payoff moment: confetti burst + toast. */
export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Achievement[]>([])

  const celebrate = useCallback((items: Achievement[]) => {
    setQueue((q) => [...q, ...items])
    setTimeout(() => setQueue((q) => q.slice(items.length)), 3200)
  }, [])

  const current = queue[0]
  return (
    <CelebrationContext.Provider value={celebrate}>
      {children}
      {current && (
        <div className="celebration" role="status">
          {Array.from({ length: 26 }, (_, i) => (
            <span
              key={`${current.code}-${i}`}
              className="particle"
              style={{
                background: COLORS[i % COLORS.length],
                ['--dx' as string]: `${Math.cos((i / 26) * Math.PI * 2) * (90 + (i % 5) * 38)}px`,
                ['--dy' as string]: `${Math.sin((i / 26) * Math.PI * 2) * (90 + (i % 5) * 38)}px`,
              }}
            />
          ))}
          <div className="toast">
            <div style={{ fontSize: '2rem' }}>{current.icon}</div>
            <h3 style={{ color: 'var(--accent)' }}>{current.title}</h3>
            <div className="muted">{current.description}</div>
          </div>
        </div>
      )}
    </CelebrationContext.Provider>
  )
}
