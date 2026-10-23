import type { AnatomySystem } from '../types/anatomy'

export default function Hotspot({ spot, active, number, offset = { x: 0, y: 0 }, onSelect }: {
  spot: AnatomySystem; active: boolean; number?: number; offset?: { x: number; y: number }; onSelect: (spot: AnatomySystem) => void
}) {
  const length = Math.hypot(offset.x, offset.y)
  return <>
    {number && length > 2 && <span className="quiz-origin" aria-hidden="true" style={{ left: `${spot.x}%`, top: `${spot.y}%` }}>
      <span className="quiz-leader" style={{ width: length, rotate: `${Math.atan2(offset.y, offset.x)}rad` }} />
    </span>}
    <button className={`hotspot${number ? ' quiz-dot' : ''}`} aria-label={number ? `Part ${number}` : spot.title}
    data-structure-id={spot.id} aria-expanded={active}
    style={{ left: `calc(${spot.x}% + ${offset.x}px)`, top: `calc(${spot.y}% + ${offset.y}px)` }}
    onClick={() => onSelect(spot)}>
    <span>{number}</span>
    </button>
  </>
}
