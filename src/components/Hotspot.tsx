import { autoUpdate, flip, FloatingPortal, offset, shift, useFloating } from '@floating-ui/react'
import { useId } from 'react'
import type { AnatomySystem } from '../types/anatomy'

export default function Hotspot({ spot, active, onOpen, onClose }: {
  spot: AnatomySystem; active: boolean; onOpen: (id: string) => void; onClose: (id: string) => void
}) {
  const tooltipId = useId()
  const { refs, floatingStyles } = useFloating({
    open: active, placement: 'top', strategy: 'fixed', whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip({ padding: 12 }), shift({ padding: 12 })],
  })
  return <>
    <button ref={refs.setReference} className="hotspot" aria-label={spot.title}
      aria-describedby={active ? tooltipId : undefined} aria-expanded={active}
      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
      onClick={() => { if (active) onClose(spot.id); else onOpen(spot.id) }}
      onKeyDown={event => { if (event.key === 'Escape') onClose(spot.id) }}>
      <span />
    </button>
    {active && <FloatingPortal><div id={tooltipId} role="tooltip" ref={refs.setFloating}
      style={floatingStyles} className="hotspot-tooltip">
      <strong>{spot.title}</strong><p>{spot.desc}</p>
    </div></FloatingPortal>}
  </>
}
