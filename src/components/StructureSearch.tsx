import { useEffect, useId, useRef, useState } from 'react'
import type { AnatomySystem } from '../types/anatomy'

export default function StructureSearch({ hotspots, active, disabled, onSelect }: {
  hotspots: AnatomySystem[]; active: string | null; disabled: boolean; onSelect: (spot: AnatomySystem) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const listId = useId()
  const normalized = query.trim().toLowerCase()
  const results = hotspots.filter(spot => `${spot.title} ${spot.id.replaceAll('_', ' ')}`.toLowerCase().includes(normalized))
  function close(restore = false) { setOpen(false); if (restore) trigger.current?.focus() }
  useEffect(() => {
    if (!open) return
    input.current?.focus()
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  useEffect(() => { if (disabled) setOpen(false) }, [disabled])
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${cursor}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, cursor, listId])
  function choose(spot: AnatomySystem) { onSelect(spot); close(true) }
  return <div className="structure-search" ref={root} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) close()
  }}>
    <button ref={trigger} className="structures-button" aria-haspopup="dialog" aria-expanded={open} disabled={disabled}
      onClick={() => { setQuery(''); setCursor(0); setOpen(value => !value) }}>Structures</button>
    {open && <div className="search-popover" role="dialog" aria-label="Find a structure" onKeyDown={event => {
      if (event.key === 'Escape') { event.stopPropagation(); close(true) }
    }}>
      <label htmlFor={`${listId}-input`}>Find a structure</label>
      <input ref={input} id={`${listId}-input`} type="search" role="combobox" aria-label="Search structures" placeholder="Search a name..."
        value={query} autoComplete="off" aria-autocomplete="list" aria-expanded="true" aria-controls={listId}
        aria-activedescendant={results[cursor] ? `${listId}-${cursor}` : undefined}
        onChange={event => { setQuery(event.target.value); setCursor(0) }} onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setCursor(value => Math.max(0, Math.min(results.length - 1, value + (event.key === 'ArrowDown' ? 1 : -1))))
          } else if (event.key === 'Enter' && results[cursor]) { event.preventDefault(); choose(results[cursor]) }
        }} />
      <ul id={listId} role="listbox" aria-label="Matching structures">
        {results.map((spot, index) => <li key={spot.id} role="none">
          <button id={`${listId}-${index}`} role="option" aria-selected={index === cursor} tabIndex={-1}
            data-current={spot.id === active} onPointerMove={() => setCursor(index)} onClick={() => choose(spot)}>
            {spot.title}<span>{spot.id === active ? 'Selected' : 'Explore'}</span>
          </button>
        </li>)}
      </ul>
      {!results.length && <p className="search-empty" role="status">No matching structures in this system.</p>}
      <p className="search-footer">Select a part to zoom in and open its study note.</p>
    </div>}
  </div>
}
