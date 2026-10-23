import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type KeyboardEvent, type MouseEvent } from 'react'
import type { AnatomySystem } from './types/anatomy'

type Point = { x: number; y: number }
type Camera = Point & { zoom: number }
const distance = (points: Point[]) => Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
const middle = (points: Point[]) => ({ x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 })
const limit = (zoom: number) => Math.max(0.5, Math.min(3, zoom))

export function useViewerCamera() {
  const viewport = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 500 })
  const [camera, setCamera] = useState<Camera>({ zoom: 1, x: 0, y: 0 })
  const current = useRef(camera)
  const pointers = useRef(new Map<number, Point>())
  const origin = useRef<Point>({ x: 0, y: 0 })
  const dragged = useRef(false)
  const suppressClickUntil = useRef(0)
  const focused = useRef<AnatomySystem | null>(null)
  const fit = Math.max(0.1, Math.min(1, (size.width - 32) / 800, (size.height - 32) / 500))
  function apply(next: Camera) {
    const maxX = 400 * fit * next.zoom + size.width / 4, maxY = 250 * fit * next.zoom + size.height / 4
    next.x = Math.max(-maxX, Math.min(maxX, next.x))
    next.y = Math.max(-maxY, Math.min(maxY, next.y))
    current.current = next
    setCamera(next)
  }
  function focus(spot: AnatomySystem) {
    focused.current = spot
    const zoom = Math.max(1.8, current.current.zoom)
    apply({ zoom, x: (0.5 - spot.x / 100) * 800 * fit * zoom, y: (0.5 - spot.y / 100) * 500 * fit * zoom })
  }
  function reset() { focused.current = null; apply({ zoom: 1, x: 0, y: 0 }) }
  function zoomTo(value: number, anchor: Point = { x: size.width / 2, y: size.height / 2 }) {
    focused.current = null
    const previous = current.current, zoom = limit(value), ratio = zoom / previous.zoom
    const x = anchor.x - size.width / 2, y = anchor.y - size.height / 2
    apply({ zoom, x: x - (x - previous.x) * ratio, y: y - (y - previous.y) * ratio })
  }
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(viewport.current!)
    return () => observer.disconnect()
  }, [])
  useLayoutEffect(() => {
    if (focused.current) focus(focused.current)
    else apply({ ...current.current })
  }, [fit, size.width, size.height])
  useEffect(() => {
    const element = viewport.current!
    function wheel(event: WheelEvent) {
      event.preventDefault()
      const bounds = element.getBoundingClientRect()
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size.height : 1)
      zoomTo(current.current.zoom * Math.exp(-delta * 0.002), { x: event.clientX - bounds.left, y: event.clientY - bounds.top })
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [fit, size.width, size.height])
  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (!pointers.current.size) { origin.current = { x: event.clientX, y: event.clientY }; dragged.current = false }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointers.current.size > 1) dragged.current = true
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('.hotspot') : null
    if (!target && event.target instanceof Element && event.target.closest('button, input, a')) {
      pointers.current.delete(event.pointerId)
      return
    }
    const captureTarget = target || event.currentTarget
    captureTarget.setPointerCapture(event.pointerId)
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId)
    if (!previous) return
    const before = [...pointers.current.values()]
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (Math.hypot(event.clientX - origin.current.x, event.clientY - origin.current.y) > 5) dragged.current = true
    if (!dragged.current) return
    focused.current = null
    if (pointers.current.size === 2) {
      const after = [...pointers.current.values()], oldCenter = middle(before), newCenter = middle(after)
      const bounds = event.currentTarget.getBoundingClientRect(), oldZoom = current.current.zoom
      zoomTo(oldZoom * distance(after) / Math.max(1, distance(before)), { x: oldCenter.x - bounds.left, y: oldCenter.y - bounds.top })
      apply({ ...current.current, x: current.current.x + newCenter.x - oldCenter.x, y: current.current.y + newCenter.y - oldCenter.y })
    } else if (pointers.current.size === 1) {
      apply({ ...current.current, x: current.current.x + event.clientX - previous.x, y: current.current.y + event.clientY - previous.y })
    }
  }
  function up(event: PointerEvent<HTMLDivElement>) {
    if (dragged.current) suppressClickUntil.current = Date.now() + 400
    pointers.current.delete(event.pointerId)
  }
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return
    const shifts: Record<string, Point> = { ArrowLeft: { x: 32, y: 0 }, ArrowRight: { x: -32, y: 0 }, ArrowUp: { x: 0, y: 32 }, ArrowDown: { x: 0, y: -32 } }
    if (shifts[event.key]) { focused.current = null; apply({ ...current.current, x: current.current.x + shifts[event.key].x, y: current.current.y + shifts[event.key].y }) }
    else if (['+', '='].includes(event.key)) zoomTo(current.current.zoom + 0.2)
    else if (event.key === '-') zoomTo(current.current.zoom - 0.2)
    else if (event.key === 'Home') reset()
    else return
    event.preventDefault()
  }
  function click(event: MouseEvent<HTMLDivElement>) {
    if (event.detail > 0 && Date.now() < suppressClickUntil.current) { event.preventDefault(); event.stopPropagation() }
  }
  return {
    viewport, zoom: camera.zoom, scale: fit * camera.zoom, focus, reset,
    changeZoom: (delta: number) => zoomTo(Math.round((current.current.zoom + delta) * 10) / 10),
    stageStyle: { width: 800 * fit * camera.zoom, height: 500 * fit * camera.zoom, left: `calc(50% + ${camera.x}px)`, top: `calc(50% + ${camera.y}px)` },
    handlers: { onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: up, onLostPointerCapture: up, onClickCapture: click, onKeyDown: keyboard },
  }
}
