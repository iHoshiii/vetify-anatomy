import { useEffect, useRef, useState } from 'react'
import { List, Minus, Plus, RotateCcw, RefreshCw } from 'lucide-react'
import IMAGE_CONFIG from '../data/image-config'
import type { AnatomySystem, AnimalId, SystemId } from '../types/anatomy'
import Hotspot from './Hotspot'

export default function Viewer({ animal, system, hotspots, onUnauthorized }: {
  animal: AnimalId; system: SystemId; hotspots: AnatomySystem[]; onUnauthorized: () => void
}) {
  const config = IMAGE_CONFIG[animal][system]
  const [zoom, setZoom] = useState(1)
  const [fit, setFit] = useState(1)
  const [active, setActive] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [source, setSource] = useState('')
  const [loadedFor, setLoadedFor] = useState('')
  const [attempt, setAttempt] = useState(0)
  const viewport = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = viewport.current!
    const observer = new ResizeObserver(([entry]) => {
      setFit(Math.max(0.1, Math.min(1, (entry.contentRect.width - 32) / 800, (entry.contentRect.height - 48) / 500)))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    let objectUrl = ''
    setStatus('loading')
    setSource('')
    setLoadedFor('')
    setActive(null)
    fetch(config.src, { credentials: 'same-origin', cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (response.status === 401 || response.status === 403) { onUnauthorized(); throw new Error('Signed out') }
        if (!response.ok || !response.headers.get('content-type')?.startsWith('image/png')) throw new Error('Image unavailable')
        const blob = await response.blob()
        if (!controller.signal.aborted) { objectUrl = URL.createObjectURL(blob); setLoadedFor(config.src); setSource(objectUrl) }
      }).catch(() => { if (!controller.signal.aborted) setStatus('error') })
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [config.src, attempt])
  const scale = fit * zoom
  const visibleStatus = loadedFor && loadedFor !== config.src ? 'loading' : status
  return <section className="viewer" aria-label={`${animal} ${system} anatomy`}>
    <div className="viewport" ref={viewport}>
      <div className="stage-layout">
        <div className="diagram-stage" data-testid="diagram-stage" style={{ width: 800 * scale, height: 500 * scale }}>
          {source && loadedFor === config.src && <img className="diagram" src={source} alt={`${animal} ${system} anatomy`}
            style={{ transform: `translate(-50%, -50%) scale(${config.scale})` }}
            onLoad={() => setStatus('ready')} onError={() => setStatus('error')} />}
          {visibleStatus === 'ready' && hotspots.map(spot => <Hotspot key={spot.id} spot={spot}
            active={active === spot.id} onOpen={setActive} onClose={id => setActive(current => current === id ? null : current)} />)}
        </div>
      </div>
    </div>
    {visibleStatus !== 'ready' && <div className="image-state" role={visibleStatus === 'error' ? 'alert' : 'status'}>
      <p>{visibleStatus === 'loading' ? 'Loading anatomy picture...' : 'This picture could not be loaded.'}</p>
      {visibleStatus === 'error' && <button className="primary-button" onClick={() => setAttempt(value => value + 1)}><RefreshCw size={16} />Retry</button>}
    </div>}
    <div className="zoom-toolbar" aria-label="Zoom controls">
      <label className="structure-menu icon-button" title="Structures">
        <List size={18} aria-hidden="true" />
        <select aria-label="Structure" value={active || ''} disabled={visibleStatus !== 'ready'}
          onChange={event => setActive(event.target.value || null)}
          onKeyDown={event => { if (event.key === 'Escape') setActive(null) }}>
          <option value="">Structures</option>
          {hotspots.map(spot => <option key={spot.id} value={spot.id}>{spot.title}</option>)}
        </select>
      </label>
      <button className="icon-button" title="Zoom out" aria-label="Zoom out" disabled={zoom <= 0.5}
        onClick={() => setZoom(value => Math.max(0.5, Math.round((value - 0.2) * 10) / 10))}><Minus size={18} /></button>
      <output aria-label="Zoom level">{Math.round(zoom * 100)}%</output>
      <button className="icon-button" title="Zoom in" aria-label="Zoom in" disabled={zoom >= 2}
        onClick={() => setZoom(value => Math.min(2, Math.round((value + 0.2) * 10) / 10))}><Plus size={18} /></button>
      <button className="icon-button" title="Reset zoom" aria-label="Reset zoom" onClick={() => setZoom(1)}><RotateCcw size={16} /></button>
    </div>
  </section>
}
