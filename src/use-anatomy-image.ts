import { useEffect, useRef, useState } from 'react'

export function useAnatomyImage(src: string, onUnauthorized: () => void) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [source, setSource] = useState('')
  const [attempt, setAttempt] = useState(0)
  const unauthorized = useRef(onUnauthorized)
  unauthorized.current = onUnauthorized
  useEffect(() => {
    const controller = new AbortController()
    let objectUrl = ''
    setStatus('loading')
    setSource('')
    fetch(src, { credentials: 'same-origin', cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (response.status === 401 || response.status === 403) { unauthorized.current(); throw new Error('Signed out') }
        if (!response.ok || !response.headers.get('content-type')?.startsWith('image/png')) throw new Error('Image unavailable')
        const blob = await response.blob()
        if (!controller.signal.aborted) { objectUrl = URL.createObjectURL(blob); setSource(objectUrl) }
      }).catch(() => { if (!controller.signal.aborted) setStatus('error') })
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [src, attempt])
  return { status, source, loaded: () => setStatus('ready'), failed: () => setStatus('error'), retry: () => setAttempt(value => value + 1) }
}
