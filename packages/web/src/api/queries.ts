import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { del, get, patch, post, put } from './client.ts'
import type {
  Achievement,
  Book,
  BookNote,
  BudgetResponse,
  CoachMemory,
  CoachMessage,
  CoachStatus,
  DailyLog,
  Dashboard,
  HeatmapDay,
  JournalEntry,
  LifeSystem,
  Milestone,
  PowerLevel,
  Projection,
  ProtocolResponse,
  Task,
  VolumeBucket,
  Workout,
  Yearbook,
} from './types.ts'
import { useCelebration } from '../components/Celebration.tsx'

/** Mutations that may unlock achievements funnel through this. */
function useUnlockAware() {
  const qc = useQueryClient()
  const celebrate = useCelebration()
  return (unlocked?: Achievement[]) => {
    if (unlocked?.length) celebrate(unlocked)
    qc.invalidateQueries()
  }
}

export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: () => get<Dashboard>('/api/dashboard') })

export const useProtocol = (date?: string) =>
  useQuery({
    queryKey: ['protocol', date ?? 'today'],
    queryFn: () => get<ProtocolResponse>(`/api/protocol${date ? `?date=${date}` : ''}`),
  })

export const useWorkouts = (params = '') =>
  useQuery({ queryKey: ['workouts', params], queryFn: () => get<Workout[]>(`/api/workouts${params}`) })

export function useCreateWorkout() {
  const onDone = useUnlockAware()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      post<{ workout: Workout; unlocked: Achievement[] }>('/api/workouts', body),
    onSuccess: (r) => onDone(r.unlocked),
  })
}

export function useDeleteWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => del(`/api/workouts/${id}`),
    onSuccess: () => qc.invalidateQueries(),
  })
}

export const useLogs = (params = '') =>
  useQuery({ queryKey: ['logs', params], queryFn: () => get<DailyLog[]>(`/api/logs${params}`) })

export function useUpsertLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ date, ...body }: { date: string } & Record<string, unknown>) => put(`/api/logs/${date}`, body),
    onSuccess: () => qc.invalidateQueries(),
  })
}

export const useTasks = (date?: string) =>
  useQuery({ queryKey: ['tasks', date ?? 'today'], queryFn: () => get<Task[]>(`/api/tasks${date ? `?date=${date}` : ''}`) })

export function useTaskMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries()
  const create = useMutation({ mutationFn: (b: Record<string, unknown>) => post<Task>('/api/tasks', b), onSuccess: invalidate })
  const update = useMutation({
    mutationFn: ({ id, ...b }: { id: number } & Record<string, unknown>) => patch<Task>(`/api/tasks/${id}`, b),
    onSuccess: invalidate,
  })
  const remove = useMutation({ mutationFn: (id: number) => del(`/api/tasks/${id}`), onSuccess: invalidate })
  const materialize = useMutation({
    mutationFn: (date?: string) => post<{ created: number }>(`/api/tasks/materialize${date ? `?date=${date}` : ''}`),
    onSuccess: invalidate,
  })
  return { create, update, remove, materialize }
}

export const useLifeSystems = () =>
  useQuery({ queryKey: ['life-systems'], queryFn: () => get<LifeSystem[]>('/api/life-systems') })

export function useLifeSystemMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['life-systems'] })
  return {
    create: useMutation({ mutationFn: (b: Record<string, unknown>) => post('/api/life-systems', b), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, ...b }: { id: number } & Record<string, unknown>) => patch(`/api/life-systems/${id}`, b),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: number) => del(`/api/life-systems/${id}`), onSuccess: invalidate }),
  }
}

export const useJournal = (search = '') =>
  useQuery({
    queryKey: ['journal', search],
    queryFn: () => get<JournalEntry[]>(`/api/journal${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  })

export function useCreateJournal() {
  const onDone = useUnlockAware()
  return useMutation({
    mutationFn: (b: Record<string, unknown>) => post<{ entry: JournalEntry; unlocked: Achievement[] }>('/api/journal', b),
    onSuccess: (r) => onDone(r.unlocked),
  })
}

export const useBooks = () => useQuery({ queryKey: ['books'], queryFn: () => get<Book[]>('/api/books') })
export const useBookNotes = (bookId: number | null) =>
  useQuery({
    queryKey: ['book-notes', bookId],
    queryFn: () => get<BookNote[]>(`/api/books/${bookId}/notes`),
    enabled: bookId !== null,
  })

export function useBookMutations() {
  const onDone = useUnlockAware()
  const qc = useQueryClient()
  return {
    create: useMutation({ mutationFn: (b: Record<string, unknown>) => post<Book>('/api/books', b), onSuccess: () => qc.invalidateQueries() }),
    update: useMutation({
      mutationFn: ({ id, ...b }: { id: number } & Record<string, unknown>) =>
        patch<{ book: Book; unlocked: Achievement[] }>(`/api/books/${id}`, b),
      onSuccess: (r) => onDone(r.unlocked),
    }),
    addNote: useMutation({
      mutationFn: ({ bookId, ...b }: { bookId: number } & Record<string, unknown>) =>
        post<{ note: BookNote; unlocked: Achievement[] }>(`/api/books/${bookId}/notes`, b),
      onSuccess: (r) => onDone(r.unlocked),
    }),
    removeNote: useMutation({
      mutationFn: ({ bookId, noteId }: { bookId: number; noteId: number }) => del(`/api/books/${bookId}/notes/${noteId}`),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['book-notes'] }),
    }),
  }
}

export const useMilestones = () => useQuery({ queryKey: ['milestones'], queryFn: () => get<Milestone[]>('/api/milestones') })

export function useToggleMilestone() {
  const onDone = useUnlockAware()
  return useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      patch<{ milestone: Milestone; unlocked: Achievement[] }>(`/api/milestones/${id}`, { completed }),
    onSuccess: (r) => onDone(r.unlocked),
  })
}

export const useBudget = () => useQuery({ queryKey: ['budget'], queryFn: () => get<BudgetResponse>('/api/budget') })

export function useBudgetMutations() {
  const onDone = useUnlockAware()
  const qc = useQueryClient()
  return {
    create: useMutation({ mutationFn: (b: Record<string, unknown>) => post('/api/budget', b), onSuccess: () => qc.invalidateQueries() }),
    update: useMutation({
      mutationFn: ({ id, ...b }: { id: number } & Record<string, unknown>) =>
        patch<{ unlocked: Achievement[] }>(`/api/budget/${id}`, b),
      onSuccess: (r) => onDone(r.unlocked),
    }),
    remove: useMutation({ mutationFn: (id: number) => del(`/api/budget/${id}`), onSuccess: () => qc.invalidateQueries() }),
  }
}

export const useAchievements = () =>
  useQuery({ queryKey: ['achievements'], queryFn: () => get<Achievement[]>('/api/achievements') })

export const useVolume = (weeks = 12) =>
  useQuery({ queryKey: ['volume', weeks], queryFn: () => get<VolumeBucket[]>(`/api/analytics/volume?weeks=${weeks}`) })

export const useLoad = () =>
  useQuery({
    queryKey: ['load'],
    queryFn: () => get<{ acute: number; chronicWeekly: number; ratio: number; series: { date: string; load: number }[] }>('/api/analytics/load'),
  })

export const useHeatmap = (year: number) =>
  useQuery({ queryKey: ['heatmap', year], queryFn: () => get<HeatmapDay[]>(`/api/analytics/heatmap?year=${year}`) })

export const usePowerLevel = () =>
  useQuery({ queryKey: ['power'], queryFn: () => get<PowerLevel>('/api/analytics/power-level') })

export const useProjection = () =>
  useQuery({ queryKey: ['projection'], queryFn: () => get<Projection>('/api/analytics/projection') })

export const useShareCard = () =>
  useQuery({ queryKey: ['share-card'], queryFn: () => get<Record<string, unknown>>('/api/analytics/card') })

export const useYearbook = (year: number) =>
  useQuery({ queryKey: ['yearbook', year], queryFn: () => get<Yearbook>(`/api/yearbook?year=${year}`) })

export const useCoachStatus = () =>
  useQuery({ queryKey: ['coach-status'], queryFn: () => get<CoachStatus>('/api/coach/status') })

export const useCoachMessages = (conversationId: number | null) =>
  useQuery({
    queryKey: ['coach-messages', conversationId],
    queryFn: () => get<CoachMessage[]>(`/api/coach/conversations/${conversationId}/messages`),
    enabled: conversationId !== null,
  })

export const useCoachMemories = () =>
  useQuery({ queryKey: ['coach-memories'], queryFn: () => get<CoachMemory[]>('/api/coach/memories') })

export const useProfile = () =>
  useQuery({ queryKey: ['profile'], queryFn: () => get<Record<string, unknown>>('/api/profile') })

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (b: Record<string, unknown>) => patch('/api/profile', b),
    onSuccess: () => qc.invalidateQueries(),
  })
}
