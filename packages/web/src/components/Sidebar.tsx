import { NavLink } from 'react-router-dom'
import { useDashboard } from '../api/queries.ts'

const NAV = [
  { to: '/', icon: '◉', label: 'Mission Control' },
  { to: '/training', icon: '⚙', label: 'Training' },
  { to: '/fitness', icon: '⏱', label: 'Fitness Log' },
  { to: '/tasks', icon: '☑', label: 'Missions' },
  { to: '/journal', icon: '✎', label: 'Journal' },
  { to: '/books', icon: '▤', label: 'Books' },
  { to: '/coach', icon: '✦', label: 'Coach' },
  { to: '/roadmap', icon: '⚑', label: 'Roadmap' },
  { to: '/analytics', icon: '∿', label: 'Analytics' },
  { to: '/yearbook', icon: '◫', label: 'Yearbook' },
  { to: '/settings', icon: '⚒', label: 'Settings' },
]

export function Sidebar() {
  const { data } = useDashboard()
  return (
    <aside className="sidebar">
      <div className="lockup">
        <div className="brand">
          VANT<em>A</em>GE
        </div>
        <div className="sub">PROJECT IRONMIND</div>
      </div>
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="icon">{n.icon}</span>
          <span className="label">{n.label}</span>
        </NavLink>
      ))}
      <div className="countdown">
        {data ? (
          <>
            <b>{data.daysToRace}</b>
            days to {data.raceName}
            <div style={{ marginTop: 4 }}>
              Day {data.dayNumber} / {data.totalDays}
            </div>
          </>
        ) : (
          <b>—</b>
        )}
      </div>
    </aside>
  )
}
