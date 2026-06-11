import { createBrowserRouter, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar.tsx'
import { CelebrationProvider } from './components/Celebration.tsx'
import { MissionControl } from './pages/MissionControl.tsx'
import { Training } from './pages/Training.tsx'
import { Fitness } from './pages/Fitness.tsx'
import { Tasks } from './pages/Tasks.tsx'
import { Journal } from './pages/Journal.tsx'
import { Books } from './pages/Books.tsx'
import { Coach } from './pages/Coach.tsx'
import { Roadmap } from './pages/Roadmap.tsx'
import { Analytics } from './pages/Analytics.tsx'
import { Yearbook } from './pages/Yearbook.tsx'
import { Settings } from './pages/Settings.tsx'
import { get } from './api/client.ts'

function Shell() {
  // theme is applied globally via data attribute; persisted server-side in settings
  const [theme, setTheme] = useState<string>('vantage')
  useEffect(() => {
    get<Record<string, string>>('/api/settings')
      .then((s) => setTheme(s.accent_theme ?? 'vantage'))
      .catch(() => {})
  }, [])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <CelebrationProvider>
      <div className="app-shell">
        <Sidebar />
        <main className="main-pane">
          <Outlet context={{ theme, setTheme }} />
        </main>
      </div>
    </CelebrationProvider>
  )
}

export const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: '/', element: <MissionControl /> },
      { path: '/training', element: <Training /> },
      { path: '/fitness', element: <Fitness /> },
      { path: '/tasks', element: <Tasks /> },
      { path: '/journal', element: <Journal /> },
      { path: '/books', element: <Books /> },
      { path: '/coach', element: <Coach /> },
      { path: '/roadmap', element: <Roadmap /> },
      { path: '/analytics', element: <Analytics /> },
      { path: '/yearbook', element: <Yearbook /> },
      { path: '/settings', element: <Settings /> },
    ],
  },
])
