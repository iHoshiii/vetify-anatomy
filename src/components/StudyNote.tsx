import { useId, useRef, useState } from 'react'
import type { AnatomySystem, AnimalId, SystemId } from '../types/anatomy'
import { ANIMALS, BODY_SYSTEMS } from '../types/anatomy'
import { getStudyNote } from '../data/study-notes'

export default function StudyNote({ spot, animal, system, index, total, onClose }: {
  spot: AnatomySystem; animal: AnimalId; system: SystemId; index: number; total: number; onClose: () => void
}) {
  const [tab, setTab] = useState<'overview' | 'recall'>('overview')
  const [revealed, setRevealed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const id = useId()
  const root = useRef<HTMLElement>(null)
  const note = getStudyNote(animal, system, spot)
  const species = ANIMALS.find(item => item.id === animal)!.name
  const bodySystem = spot.id === 'air_sacs' ? 'Respiratory connection' : BODY_SYSTEMS.find(item => item.id === system)!.name.replace(' System', '')
  return <aside ref={root} className={`study-note${expanded ? ' expanded' : ''}`} role="region" aria-labelledby={`${id}-title`}>
    <div className="note-header">
      <div className="note-eyebrow"><span>Study note</span><span>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span></div>
      <button className="note-close" aria-label="Close study note" onClick={onClose}>Close</button>
      <button className="note-expand" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? 'Minimize' : 'Read note'}</button>
      <p className="note-context">{species} <span aria-hidden="true">/</span> {bodySystem}</p>
      <h2 id={`${id}-title`} aria-live="polite">{spot.title}</h2>
      <div className="note-tabs" role="tablist" aria-label="Study note views" onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const next = event.key === 'Home' ? 'overview' : event.key === 'End' ? 'recall' : tab === 'overview' ? 'recall' : 'overview'
        setTab(next)
        root.current?.querySelector<HTMLButtonElement>(`[data-tab="${next}"]`)?.focus()
      }}>
        {(['overview', 'recall'] as const).map(value => <button key={value} data-tab={value} role="tab" id={`${id}-${value}`}
          aria-selected={tab === value} aria-controls={`${id}-panel`} tabIndex={tab === value ? 0 : -1}
          onClick={() => setTab(value)}>{value === 'overview' ? 'Overview' : 'Try recall'}</button>)}
      </div>
    </div>
    <div className="note-body" id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${tab}`} tabIndex={0}>
      {tab === 'overview' ? <>
        <section><h3>Description</h3><p>{note.description}</p></section>
        <section><h3>Purpose</h3><p>{note.purpose}</p></section>
        <section className="remember-card"><h3>Remember this</h3><p>{note.remember}</p></section>
        <a className="note-source" href={note.source.url} target="_blank" rel="noreferrer">Read more: {note.source.name}</a>
      </> : <section className="recall-card">
        <span className="note-eyebrow">Think it through</span>
        <h3>{note.question}</h3>
        <p>Say your answer before checking.</p>
        <button className="note-action" aria-expanded={revealed} onClick={() => setRevealed(value => !value)}>
          {revealed ? 'Hide explanation' : 'Check your reasoning'}
        </button>
        {revealed && <div className="recall-answer" role="status"><p>{note.purpose}</p><p>{note.remember}</p></div>}
      </section>}
    </div>
  </aside>
}
