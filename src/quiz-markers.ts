import type { AnatomySystem } from './types/anatomy'

export function quizMarkers(hotspots: AnatomySystem[], width: number, height: number) {
  const originals = hotspots.map(spot => ({ x: spot.x / 100 * width, y: spot.y / 100 * height }))
  const points = originals.map(point => ({ ...point }))
  for (let pass = 0; pass < 80; pass++) {
    let moved = false
    for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
      let dx = points[j].x - points[i].x, dy = points[j].y - points[i].y
      const length = Math.hypot(dx, dy)
      if (length >= 48) continue
      if (length < 0.01) { dx = 1; dy = 0 }
      const amount = (48 - length) / (2 * (length < 0.01 ? 1 : length))
      points[i].x -= dx * amount; points[i].y -= dy * amount
      points[j].x += dx * amount; points[j].y += dy * amount
      moved = true
    }
    if (!moved) break
  }
  return points.map((point, index) => ({ x: point.x - originals[index].x, y: point.y - originals[index].y }))
}
