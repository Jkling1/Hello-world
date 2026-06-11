/** Typed fetch wrapper — every external call goes through here. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message)
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })
  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'message' in (body as object)
        ? String((body as { message: string }).message)
        : `${res.status} ${res.statusText}`
    throw new ApiError(res.status, msg, body)
  }
  return body as T
}

export const get = <T>(url: string) => fetchJson<T>(url)
export const post = <T>(url: string, data?: unknown) =>
  fetchJson<T>(url, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined })
export const patch = <T>(url: string, data: unknown) =>
  fetchJson<T>(url, { method: 'PATCH', body: JSON.stringify(data) })
export const put = <T>(url: string, data: unknown) =>
  fetchJson<T>(url, { method: 'PUT', body: JSON.stringify(data) })
export const del = <T>(url: string) => fetchJson<T>(url, { method: 'DELETE' })

export interface CoachStreamEvent {
  conversationId?: number
  delta?: string
  done?: boolean
  messageId?: number
  error?: string
}

/**
 * POST + fetch-stream SSE reader for coach chat (EventSource can't POST).
 */
export async function streamCoachChat(
  payload: { conversationId?: number; message: string },
  onEvent: (e: CoachStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch('/api/coach/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
  if (!res.ok || !res.body) throw new ApiError(res.status, 'coach stream failed to start')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const frames = buffer.split('\n\n')
    buffer = frames.pop() ?? ''
    for (const frame of frames) {
      const line = frame.split('\n').find((l) => l.startsWith('data: '))
      if (!line) continue
      try {
        onEvent(JSON.parse(line.slice(6)) as CoachStreamEvent)
      } catch {
        // malformed frame — skip
      }
    }
  }
}
