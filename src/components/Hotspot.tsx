import { autoUpdate, flip, FloatingPortal, shift, useFloating } from '@floating-ui/react'
import { useId, useRef } from 'react'
import type { AnatomySystem } from '../types/anatomy'

export default function Hotspot({ spot, active, onOpen, onClose }: {
  spot: AnatomySystem; active: boolean; onOpen: (id: string) => void; onClose: (id: string) => void
}) {
  const tooltipId = useId()
  const pinned = useRef(false)
  const { refs, floatingStyles } = useFloating({
    open: active, placement: 'top', strategy: 'fixed', whileElementsMounted: autoUpdate,
    middleware: [flip({ padding: 12 }), shift({ padding: 12 })],
  })
  return <>
    <button ref={refs.setReference} className="hotspot" aria-label={spot.title}
      aria-describedby={active ? tooltipId : undefined} aria-expanded={active}
      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
      onPointerEnter={event => { if (event.pointerType === 'mouse') onOpen(spot.id) }}
      onPointerLeave={() => { if (!pinned.current) onClose(spot.id) }}
      onFocus={event => { if (event.currentTarget.matches(':focus-visible')) onOpen(spot.id) }}
      onBlur={() => { pinned.current = false; onClose(spot.id) }}
      onClick={() => { pinned.current = !pinned.current; if (pinned.current) onOpen(spot.id); else onClose(spot.id) }}
      onKeyDown={event => { if (event.key === 'Escape') { pinned.current = false; onClose(spot.id) } }}>
      <span />
    </button>
    {active && <FloatingPortal><div id={tooltipId} role="tooltip" ref={refs.setFloating}
      style={floatingStyles} className="hotspot-tooltip">
      <strong>{spot.title}</strong><p>{spot.desc}</p>
    </div></FloatingPortal>}
  </>
}
