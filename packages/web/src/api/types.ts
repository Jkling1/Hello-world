import type { DailyProtocol, PhaseInfo, UserState } from '@vantage/engine'

export interface Dashboard {
  date: string
  name: string
  raceName: string
  raceDate: string
  dayNumber: number
  totalDays: number
  daysToRace: number
  phase: PhaseInfo
  streak: number
  tasksDone: number
  tasksTotal: number
  activeBooks: number
  weekVolume: { minutes: number; km: number; sessions: number }
  userState: UserState
  protocol: DailyProtocol
  seeded: boolean
}

export interface Workout {
  id: number
  date: string
  type: string
  title: string | null
  duration_min: number
  distance_km: number | null
  effort: number | null
  feeling: string
  notes: string | null
  source: string
}

export interface DailyLog {
  id: number
  date: string
  fatigue: number | null
  mood: number | null
  sleep_hours: number | null
  adherence: number | null
  missed_workout: number
  notes: string | null
}

export interface Task {
  id: number
  date: string
  title: string
  category: string
  cadence: string
  big_rock: number
  completed: number
  origin: string
}

export interface LifeSystem {
  id: number
  name: string
  day_of_week: number | null
  cadence: string
  category: string
  active: number
}

export interface JournalEntry {
  id: number
  date: string
  mood: number | null
  content: string
  prompts_json: string
  voice_transcript: string | null
  tags: string
}

export interface Book {
  id: number
  title: string
  author: string | null
  total_pages: number | null
  current_page: number
  status: 'active' | 'finished' | 'abandoned'
  rating: number | null
  review: string | null
  noteCount?: number
}

export interface BookNote {
  id: number
  book_id: number
  kind: 'note' | 'quote' | 'takeaway'
  content: string
  tags: string
  page: number | null
}

export interface Milestone {
  id: number
  title: string
  description: string | null
  target_date: string | null
  completed: number
  completed_at: string | null
}

export interface BudgetItem {
  id: number
  label: string
  planned_cents: number
  spent_cents: number
}

export interface BudgetResponse {
  items: BudgetItem[]
  totals: { planned_cents: number; spent_cents: number; pct: number }
}

export interface Achievement {
  id: number
  code: string
  title: string
  description: string | null
  icon: string
  unlocked_at: string | null
}

export interface CoachMessage {
  id: number
  conversation_id: number
  role: 'user' | 'assistant'
  content: string
}

export interface CoachMemory {
  id: number
  content: string
  category: string
  salience: number
  created_at: string
}

export interface CoachStatus {
  name: string
  model: string
  hasKey: boolean
}

export interface VolumeBucket {
  start: string
  end: string
  minutes: number
  km: number
  sessions: number
}

export interface HeatmapDay {
  date: string
  minutes: number
  sessions: number
  level: number
}

export interface YearbookEvent {
  date: string
  kind: 'workout' | 'milestone' | 'journal' | 'book' | 'achievement'
  title: string
  detail?: string
}

export interface Yearbook {
  year: number
  stats: { workouts: number; hours: number; km: number; journalEntries: number; booksFinished: number; milestones: number }
  events: YearbookEvent[]
  heatmap: HeatmapDay[]
}

export interface PowerLevel {
  score: number
  components: Record<string, number>
}

export interface Projection {
  swimMin: number | null
  bikeMin: number | null
  runMin: number | null
  transitionsMin: number
  totalMin: number | null
  note: string
}

export interface ProtocolResponse {
  protocol: DailyProtocol
  markdown: string
  state: UserState
}
