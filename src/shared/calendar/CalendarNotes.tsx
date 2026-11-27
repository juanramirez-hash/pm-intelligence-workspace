// CAL-001: discreet notes about the business calendar (missing years, quota
// template that differs). Nothing is rendered without notes.

export function CalendarNotes({
  notes,
  className = '',
}: {
  notes: readonly string[]
  className?: string
}) {
  if (notes.length === 0) {
    return null
  }

  return (
    <ul
      data-calendar-notes="true"
      className={`flex flex-col gap-1 text-xs text-slate-500 ${className}`}
    >
      {notes.map((note) => (
        <li key={note}>
          {note}
        </li>
      ))}
    </ul>
  )
}
