import type { AnatomySystem } from '../types/anatomy'
import StructureSearch from './StructureSearch'

export default function ViewerControls({ hotspots, active, ready, zoom, showDots, quizzing, onSelect, onZoom, onReset, onDots, onQuiz }: {
  hotspots: AnatomySystem[]; active: string | null; ready: boolean; zoom: number; showDots: boolean; quizzing: boolean
  onSelect: (spot: AnatomySystem) => void; onZoom: (delta: number) => void; onReset: () => void; onDots: () => void; onQuiz: () => void
}) {
  return <div className="viewer-controls">
    <div className="zoom-toolbar" role="group" aria-label="Viewer controls">
      <div className="camera-controls">
        <StructureSearch hotspots={hotspots} active={active} disabled={!ready || quizzing} onSelect={onSelect} />
        <span className="toolbar-divider" aria-hidden="true" />
        <button className="zoom-button" aria-label="Zoom out" disabled={!ready || zoom <= 0.5} onClick={() => onZoom(-0.2)}>−</button>
        <output aria-label="Zoom level">{Math.round(zoom * 100)}%</output>
        <button className="zoom-button" aria-label="Zoom in" disabled={!ready || zoom >= 3} onClick={() => onZoom(0.2)}>+</button>
        <button className="reset-button" aria-label="Reset zoom" disabled={!ready} onClick={onReset}>Reset</button>
      </div>
      <div className="study-controls">
        <button className="quiet-button" disabled={!ready || quizzing} aria-pressed={!showDots} onClick={onDots}>{showDots ? 'Hide dots' : 'Show dots'}</button>
        <button className="quiet-button" disabled={!ready || quizzing} onClick={onQuiz}>Quiz me</button>
      </div>
    </div>
  </div>
}
