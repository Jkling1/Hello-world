import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useProfile, useUpdateProfile, useDashboard } from '../api/queries.ts'
import { patch } from '../api/client.ts'
import { Card, SkeletonCard } from '../components/ui.tsx'

export function Settings() {
  const { data: profile, isLoading } = useProfile()
  const { data: dash } = useDashboard()
  const update = useUpdateProfile()
  const { theme, setTheme } = useOutletContext<{ theme: string; setTheme: (t: string) => void }>()
  const [saved, setSaved] = useState(false)

  const pickTheme = (t: string) => {
    setTheme(t)
    patch('/api/settings', { accent_theme: t }).catch(() => {})
  }

  if (isLoading || !profile) return <div className="page"><SkeletonCard lines={5} /></div>

  return (
    <div className="page">
      <h1>Settings</h1>

      <Card>
        <h2>Profile & program</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const f = new FormData(e.currentTarget)
            update.mutate(Object.fromEntries(f.entries()) as Record<string, unknown>, {
              onSuccess: () => {
                setSaved(true)
                setTimeout(() => setSaved(false), 1500)
              },
            })
          }}
        >
          <div className="grid cols-2">
            <label className="field">
              Name
              <input name="name" defaultValue={String(profile.name ?? '')} />
            </label>
            <label className="field">
              Race
              <input name="race_name" defaultValue={String(profile.race_name ?? '')} />
            </label>
            <label className="field">
              Race date (RACE_DATE)
              <input name="race_date" type="date" defaultValue={String(profile.race_date ?? '')} />
            </label>
            <label className="field">
              Program start (PROGRAM_START)
              <input name="program_start" type="date" defaultValue={String(profile.program_start ?? '')} />
            </label>
          </div>
          <label className="field">
            Notes for the coach
            <textarea name="persona_notes" rows={2} defaultValue={String(profile.persona_notes ?? '')} placeholder="Anything the coach should always know…" />
          </label>
          <button className="primary">{saved ? '✓ Saved' : 'Save'}</button>
        </form>
        <p className="tiny" style={{ marginTop: 8 }}>
          Changing dates re-times every phase proportionally — the engine computes everything from these two values.
        </p>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <h2>Theme</h2>
        <div className="row">
          <button className={theme !== 'miami' ? 'primary' : ''} onClick={() => pickTheme('vantage')}>
            ⚡ Electric baby blue
          </button>
          <button className={theme === 'miami' ? 'primary' : ''} onClick={() => pickTheme('miami')}>
            🌴 Miami neon
          </button>
        </div>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <h2>Data</h2>
        {dash?.seeded && (
          <p className="muted">
            Demo seed data is loaded (marked <code>source='seed'</code>). Purge & regenerate from the CLI:{' '}
            <code>npm run seed -- --reset</code>
          </p>
        )}
        <p className="tiny">
          Storage: local SQLite (<code>data/vantage.db</code>) behind a swappable persistence layer — cloud sync (Supabase/Firebase)
          can plug in without touching the app. Single-user v1, multi-user-ready schema.
        </p>
      </Card>
    </div>
  )
}
