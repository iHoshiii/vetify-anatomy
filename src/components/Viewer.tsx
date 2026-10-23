import { useEffect, useState } from 'react'
import IMAGE_CONFIG from '../data/image-config'
import type { AnatomySystem, AnimalId, SystemId } from '../types/anatomy'
import { useAnatomyImage } from '../use-anatomy-image'
import { useViewerCamera } from '../use-viewer-camera'
import { useAnatomyQuiz } from '../use-anatomy-quiz'
import { quizMarkers } from '../quiz-markers'
import Hotspot from './Hotspot'
import StudyNote from './StudyNote'
import ViewerControls from './ViewerControls'
import QuizPanel from './QuizPanel'

export default function Viewer({ animal, system, hotspots, onUnauthorized }: {
  animal: AnimalId; system: SystemId; hotspots: AnatomySystem[]; onUnauthorized: () => void
}) {
  const config = IMAGE_CONFIG[animal][system]
  const image = useAnatomyImage(config.src, onUnauthorized)
  const camera = useViewerCamera()
  const quiz = useAnatomyQuiz(hotspots)
  const [active, setActive] = useState<AnatomySystem | null>(null)
  const [showDots, setShowDots] = useState(true)
  const ready = image.status === 'ready'
  const markers = quiz.round ? quizMarkers(hotspots, camera.stageStyle.width, camera.stageStyle.height) : []
  function closeNote(restoreFocus = false) {
    if (restoreFocus && active) camera.viewport.current?.querySelector<HTMLButtonElement>(`[data-structure-id="${active.id}"]`)?.focus()
    setActive(null)
  }
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') closeNote(true) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [active])
  function explore(spot: AnatomySystem) { setShowDots(true); setActive(spot); camera.focus(spot) }
  function pick(spot: AnatomySystem) {
    if (quiz.round) { if (quiz.answer(spot.id)) explore(spot); return }
    if (active?.id === spot.id) closeNote()
    else explore(spot)
  }
  function reset() { closeNote(); camera.reset() }
  function startQuiz() { reset(); quiz.start() }
  function reveal() { const spot = quiz.reveal(); if (spot) explore(spot) }
  function exitQuiz() { quiz.exit(); reset() }
  return <section className={`viewer${active ? ' has-note' : ''}`} aria-label={`${animal} ${system} anatomy`}>
    {quiz.round && <QuizPanel quiz={quiz} onReveal={reveal} onNext={() => { reset(); quiz.next() }} onExit={exitQuiz} />}
    <div className="viewer-main">
      <div className="viewport" ref={camera.viewport} tabIndex={0} role="group" aria-label="Anatomy canvas"
        aria-description="Drag to pan. Scroll or pinch to zoom. Use arrow keys to pan, plus and minus to zoom, Home to reset."
        {...camera.handlers}>
        <div className="diagram-stage" data-testid="diagram-stage" style={camera.stageStyle}>
          {image.source && <img className="diagram" src={image.source} alt={`${animal} ${system} anatomy`}
            style={{ transform: `translate(-50%, -50%) scale(${config.scale})` }} onLoad={image.loaded} onError={image.failed} />}
          {ready && (showDots || quiz.round) && hotspots.map((spot, index) => <Hotspot key={spot.id} spot={spot}
            active={active?.id === spot.id} number={quiz.round ? index + 1 : undefined} offset={markers[index]} onSelect={pick} />)}
        </div>
        {!ready && <div className="image-state" role={image.status === 'error' ? 'alert' : 'status'}>
          <p>{image.status === 'loading' ? 'Loading anatomy picture...' : 'This picture could not be loaded.'}</p>
          {image.status === 'error' && <button className="primary-button" onClick={image.retry}>Retry</button>}
        </div>}
      </div>
      {active && ready && <StudyNote key={active.id} spot={active} animal={animal} system={system}
        index={hotspots.findIndex(spot => spot.id === active.id)} total={hotspots.length} onClose={() => closeNote(true)} />}
    </div>
    <ViewerControls hotspots={hotspots} active={active?.id ?? null} ready={ready} zoom={camera.zoom}
      showDots={showDots || !!quiz.round} quizzing={!!quiz.round} onSelect={explore} onZoom={camera.changeZoom} onReset={reset}
      onDots={() => { closeNote(); setShowDots(value => !value) }} onQuiz={startQuiz} />
  </section>
}
