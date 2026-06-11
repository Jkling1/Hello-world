import { useState, type FormEvent } from 'react'
import { useBookMutations, useBookNotes, useBooks } from '../api/queries.ts'
import { Card, ErrorNote, ProgressBar, SkeletonCard } from '../components/ui.tsx'
import type { Book } from '../api/types.ts'

function BookCard({ book }: { book: Book }) {
  const { update, addNote, removeNote } = useBookMutations()
  const [open, setOpen] = useState(false)
  const { data: notes } = useBookNotes(open ? book.id : null)
  const [noteKind, setNoteKind] = useState<'note' | 'quote' | 'takeaway'>('note')
  const [noteText, setNoteText] = useState('')
  const pct = book.total_pages ? (book.current_page / book.total_pages) * 100 : 0

  const submitNote = (e: FormEvent) => {
    e.preventDefault()
    if (!noteText.trim()) return
    addNote.mutate({ bookId: book.id, kind: noteKind, content: noteText }, { onSuccess: () => setNoteText('') })
  }

  return (
    <Card>
      <div className="row between wrap">
        <div>
          <h2 style={{ marginBottom: 2 }}>{book.title}</h2>
          <div className="muted">{book.author}</div>
        </div>
        <div className="row">
          {book.status === 'finished' && <span className="badge success">finished {book.rating ? `· ${'★'.repeat(book.rating)}` : ''}</span>}
          <button className="ghost small" onClick={() => setOpen(!open)}>
            {open ? 'close' : `${book.noteCount ?? 0} notes →`}
          </button>
        </div>
      </div>
      {book.status === 'active' && (
        <>
          <div className="row" style={{ margin: '10px 0' }}>
            <div style={{ flex: 1 }}>
              <ProgressBar pct={pct} />
            </div>
            <span className="mono tiny">
              p.{book.current_page}/{book.total_pages ?? '?'}
            </span>
          </div>
          <div className="row wrap">
            <input
              type="number"
              style={{ width: 110 }}
              placeholder="page…"
              defaultValue={book.current_page}
              onBlur={(e) => {
                const p = Number(e.target.value)
                if (p !== book.current_page) update.mutate({ id: book.id, currentPage: p })
              }}
            />
            <button
              className="small"
              onClick={() => {
                const rating = Number(window.prompt('Rating 1-5?', '5')) || null
                const review = window.prompt('One-line review?') ?? undefined
                update.mutate({ id: book.id, status: 'finished', rating, review })
              }}
            >
              ✓ Finish & rate
            </button>
          </div>
        </>
      )}
      {book.review && <p className="muted" style={{ fontStyle: 'italic' }}>“{book.review}”</p>}
      {open && (
        <>
          <hr className="divider" />
          {(notes ?? []).map((n) => (
            <div key={n.id} className="row between" style={{ padding: '5px 0' }}>
              <span>
                <span className={`chip ${n.kind === 'takeaway' ? 'cat-Knowledge' : ''}`}>{n.kind}</span>{' '}
                {n.kind === 'quote' ? <i>“{n.content}”</i> : n.content}
                {n.page && <span className="tiny"> · p.{n.page}</span>}
              </span>
              <button className="ghost small" onClick={() => removeNote.mutate({ bookId: book.id, noteId: n.id })}>✕</button>
            </div>
          ))}
          <form onSubmit={submitNote} className="row wrap" style={{ marginTop: 8 }}>
            <select style={{ width: 120 }} value={noteKind} onChange={(e) => setNoteKind(e.target.value as never)}>
              <option value="note">note</option>
              <option value="quote">quote</option>
              <option value="takeaway">takeaway</option>
            </select>
            <input style={{ flex: 1, minWidth: 180 }} placeholder="Capture it…" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <button className="primary small">Add</button>
          </form>
          <p className="tiny" style={{ marginTop: 6 }}>Takeaways feed the coach’s memory — it will resurface them when relevant.</p>
        </>
      )}
    </Card>
  )
}

export function Books() {
  const { data: books, isLoading, error } = useBooks()
  const { create } = useBookMutations()
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [pages, setPages] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    create.mutate(
      { title, author: author || undefined, totalPages: pages ? Number(pages) : undefined },
      { onSuccess: () => (setTitle(''), setAuthor(''), setPages('')) },
    )
  }

  return (
    <div className="page">
      <h1>Learning Log</h1>
      <Card>
        <form onSubmit={submit} className="row wrap">
          <input style={{ flex: 2, minWidth: 160 }} placeholder="Book title…" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input style={{ flex: 1, minWidth: 120 }} placeholder="Author" value={author} onChange={(e) => setAuthor(e.target.value)} />
          <input style={{ width: 90 }} type="number" placeholder="pages" value={pages} onChange={(e) => setPages(e.target.value)} />
          <button className="primary">Start reading</button>
        </form>
      </Card>
      {isLoading && <SkeletonCard lines={4} />}
      {error && <ErrorNote error={error} />}
      <div style={{ marginTop: 16, display: 'grid', gap: 16 }}>
        {(books ?? []).map((b) => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>
    </div>
  )
}
