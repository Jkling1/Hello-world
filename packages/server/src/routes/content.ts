import type { FastifyInstance } from 'fastify'
import type { DB } from '../db.ts'
import { today } from '../state.ts'
import { evaluateAchievements } from '../achievements.ts'
import { extractMemoriesFromText } from '../coach/memory.ts'

export function registerContentRoutes(app: FastifyInstance, db: DB): void {
  // ---- Journal -----------------------------------------------------------

  app.get<{ Querystring: { search?: string; from?: string; to?: string; limit?: number } }>(
    '/api/journal',
    async (req) => {
      const { search, from = '0000', to = '9999', limit = 100 } = req.query
      if (search && search.trim()) {
        const safe = search.replace(/['"*^]/g, ' ').trim()
        if (!safe) return []
        return db
          .prepare(
            `SELECT j.* FROM journal_fts f JOIN journal_entries j ON j.id = f.rowid
             WHERE journal_fts MATCH ? AND j.date >= ? AND j.date <= ?
             ORDER BY rank LIMIT ?`,
          )
          .all(safe.split(/\s+/).map((t) => `"${t}"`).join(' '), from, to, limit)
      }
      return db
        .prepare('SELECT * FROM journal_entries WHERE date >= ? AND date <= ? ORDER BY date DESC, id DESC LIMIT ?')
        .all(from, to, limit)
    },
  )

  app.get<{ Params: { id: string } }>('/api/journal/:id', async (req, reply) => {
    const row = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(req.params.id)
    if (!row) return reply.code(404).send({ error: 'not found' })
    return row
  })

  app.post<{ Body: Record<string, unknown> }>(
    '/api/journal',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            mood: { type: ['integer', 'null'], minimum: 1, maximum: 10 },
            content: { type: 'string' },
            prompts: { type: 'array' },
            voiceTranscript: { type: ['string', 'null'] },
            tags: { type: 'array' },
          },
        },
      },
    },
    async (req, reply) => {
      const b = req.body as Record<string, never>
      const date = (b.date as string) ?? today()
      const info = db
        .prepare(
          `INSERT INTO journal_entries (date, mood, content, prompts_json, voice_transcript, tags)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(date, b.mood ?? null, b.content ?? '', JSON.stringify(b.prompts ?? []), b.voiceTranscript ?? null, JSON.stringify(b.tags ?? []))
      // mood flows into the daily log so the engine sees it
      if (b.mood != null) {
        db.prepare(
          `INSERT INTO daily_logs (date, mood) VALUES (?, ?)
           ON CONFLICT(date) DO UPDATE SET mood = excluded.mood`,
        ).run(date, b.mood)
      }
      // journal feeds the coach's long-term memory (never blocks the save)
      try {
        const text = [b.content, b.voiceTranscript].filter(Boolean).join('\n')
        extractMemoriesFromText(db, text, 'journal')
      } catch {
        /* memory extraction is best-effort */
      }
      const unlocked = evaluateAchievements(db, today())
      reply.code(201)
      return { entry: db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(info.lastInsertRowid), unlocked }
    },
  )

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>('/api/journal/:id', async (req, reply) => {
    const b = req.body as Record<string, never>
    const sets: string[] = []
    const vals: unknown[] = []
    if (b.content !== undefined) (sets.push('content = ?'), vals.push(b.content))
    if (b.mood !== undefined) (sets.push('mood = ?'), vals.push(b.mood))
    if (b.voiceTranscript !== undefined) (sets.push('voice_transcript = ?'), vals.push(b.voiceTranscript))
    if (b.prompts !== undefined) (sets.push('prompts_json = ?'), vals.push(JSON.stringify(b.prompts)))
    if (b.tags !== undefined) (sets.push('tags = ?'), vals.push(JSON.stringify(b.tags)))
    if (sets.length === 0) return reply.code(400).send({ error: 'no fields to update' })
    const info = db.prepare(`UPDATE journal_entries SET ${sets.join(', ')} WHERE id = ?`).run(...vals, req.params.id)
    if (info.changes === 0) return reply.code(404).send({ error: 'not found' })
    return db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(req.params.id)
  })

  app.delete<{ Params: { id: string } }>('/api/journal/:id', async (req, reply) => {
    const info = db.prepare('DELETE FROM journal_entries WHERE id = ?').run(req.params.id)
    if (info.changes === 0) return reply.code(404).send({ error: 'not found' })
    return { ok: true }
  })

  // ---- Books -------------------------------------------------------------

  app.get('/api/books', async () => {
    const books = db.prepare('SELECT * FROM books ORDER BY status = "active" DESC, finished_at DESC, id DESC').all() as Array<{ id: number }>
    const countNotes = db.prepare('SELECT COUNT(*) AS n FROM book_notes WHERE book_id = ?')
    return books.map((b) => ({ ...b, noteCount: (countNotes.get(b.id) as { n: number }).n }))
  })

  app.post<{ Body: Record<string, unknown> }>(
    '/api/books',
    {
      schema: {
        body: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', minLength: 1 },
            author: { type: 'string' },
            totalPages: { type: ['integer', 'null'], minimum: 1 },
          },
        },
      },
    },
    async (req, reply) => {
      const b = req.body as Record<string, never>
      const info = db
        .prepare('INSERT INTO books (title, author, total_pages, started_at) VALUES (?, ?, ?, ?)')
        .run(b.title, b.author ?? null, b.totalPages ?? null, today())
      reply.code(201)
      return db.prepare('SELECT * FROM books WHERE id = ?').get(info.lastInsertRowid)
    },
  )

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>('/api/books/:id', async (req, reply) => {
    const b = req.body as Record<string, never>
    const sets: string[] = []
    const vals: unknown[] = []
    const map: Record<string, string> = { title: 'title', author: 'author', totalPages: 'total_pages', currentPage: 'current_page', rating: 'rating', review: 'review' }
    for (const [k, col] of Object.entries(map)) {
      if (b[k] !== undefined) (sets.push(`${col} = ?`), vals.push(b[k]))
    }
    if (b.status !== undefined) {
      sets.push('status = ?')
      vals.push(b.status)
      if (b.status === 'finished') (sets.push('finished_at = ?'), vals.push(today()))
    }
    if (sets.length === 0) return reply.code(400).send({ error: 'no fields to update' })
    const info = db.prepare(`UPDATE books SET ${sets.join(', ')} WHERE id = ?`).run(...vals, req.params.id)
    if (info.changes === 0) return reply.code(404).send({ error: 'not found' })
    const unlocked = evaluateAchievements(db, today())
    return { book: db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id), unlocked }
  })

  app.delete<{ Params: { id: string } }>('/api/books/:id', async (req, reply) => {
    const info = db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id)
    if (info.changes === 0) return reply.code(404).send({ error: 'not found' })
    return { ok: true }
  })

  app.get<{ Params: { id: string } }>('/api/books/:id/notes', async (req) =>
    db.prepare('SELECT * FROM book_notes WHERE book_id = ? ORDER BY id DESC').all(req.params.id),
  )

  app.post<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/api/books/:id/notes',
    {
      schema: {
        body: {
          type: 'object',
          required: ['content'],
          properties: {
            kind: { type: 'string', enum: ['note', 'quote', 'takeaway'] },
            content: { type: 'string', minLength: 1 },
            tags: { type: 'array' },
            page: { type: ['integer', 'null'] },
          },
        },
      },
    },
    async (req, reply) => {
      const b = req.body as Record<string, never>
      const book = db.prepare('SELECT id FROM books WHERE id = ?').get(req.params.id)
      if (!book) return reply.code(404).send({ error: 'book not found' })
      const info = db
        .prepare('INSERT INTO book_notes (book_id, kind, content, tags, page) VALUES (?, ?, ?, ?, ?)')
        .run(req.params.id, b.kind ?? 'note', b.content, JSON.stringify(b.tags ?? []), b.page ?? null)
      // takeaways become coach memories so they can resurface
      if ((b.kind ?? 'note') === 'takeaway') {
        try {
          db.prepare(
            `INSERT INTO coach_memories (content, category, salience, source) VALUES (?, 'fact', 4, 'journal')`,
          ).run(`Book takeaway: ${b.content}`)
        } catch {
          /* best-effort */
        }
      }
      const unlocked = evaluateAchievements(db, today())
      reply.code(201)
      return { note: db.prepare('SELECT * FROM book_notes WHERE id = ?').get(info.lastInsertRowid), unlocked }
    },
  )

  app.delete<{ Params: { id: string; noteId: string } }>('/api/books/:id/notes/:noteId', async (req, reply) => {
    const info = db.prepare('DELETE FROM book_notes WHERE id = ? AND book_id = ?').run(req.params.noteId, req.params.id)
    if (info.changes === 0) return reply.code(404).send({ error: 'not found' })
    return { ok: true }
  })
}
