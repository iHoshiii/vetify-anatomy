import { useEffect, useRef, useState } from 'react'
import { anatomyView, MAIN_ORIGIN, mainAnatomyUrl, mainDestination } from '../integration'

const handoffKey = 'vetify-anatomy-handoff'

export default function MainShell() {
  const frame = useRef<HTMLIFrameElement>(null)
  const [failure, setFailure] = useState(new URLSearchParams(location.search).get('auth'))
  const view = anatomyView(location.pathname)
  useEffect(() => {
    let redirecting = false
    function receive(event: MessageEvent) {
      if (event.origin !== MAIN_ORIGIN || event.source !== frame.current?.contentWindow) return
      if (event.data?.type === 'vetify-anatomy:ready') {
        sessionStorage.removeItem(handoffKey)
        if (location.search) history.replaceState(null, '', location.pathname)
      } else if (event.data?.type === 'vetify-anatomy:navigate') {
        const destination = mainDestination(event.data.path)
        if (destination) location.assign(destination)
      } else if (event.data?.type === 'vetify-anatomy:authenticate' && !redirecting) {
        const previous = Number(sessionStorage.getItem(handoffKey))
        if (previous && Date.now() - previous < 60_000) { setFailure('failed'); return }
        redirecting = true
        sessionStorage.setItem(handoffKey, String(Date.now()))
        const destination = new URL('/auth/login', location.origin)
        destination.searchParams.set('returnTo', anatomyView(typeof event.data.view === 'string' ? event.data.view : view))
        location.replace(destination.href)
      } else if (event.data?.type === 'vetify-anatomy:retry') {
        sessionStorage.removeItem(handoffKey)
        setFailure(null)
      }
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [view])
  return <iframe ref={frame} title="Vetify Anatomy" src={mainAnatomyUrl(view, failure)}
    style={{ display: 'block', width: '100%', height: '100dvh', border: 0 }}
    referrerPolicy="strict-origin" />
}
