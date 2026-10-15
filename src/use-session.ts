import { useCallback, useEffect, useRef, useState } from 'react'

export type SessionStatus = 'loading' | 'signed-in' | 'signed-out' | 'unavailable'
export function useSession() {
  const [status, setStatus] = useState<SessionStatus>('loading')
  const lastStatus = useRef<SessionStatus>('loading')
  const revision = useRef(0)
  const [logoutFailed, setLogoutFailed] = useState(false)
  const check = useCallback(async (signal?: AbortSignal) => {
    const requestRevision = revision.current
    try {
      const response = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store', signal })
      const next = response.ok ? 'signed-in' : response.status === 401 ? 'signed-out' : 'unavailable'
      if (!signal?.aborted && requestRevision === revision.current) { lastStatus.current = next; setStatus(next) }
    } catch {
      if (!signal?.aborted && requestRevision === revision.current) { lastStatus.current = 'unavailable'; setStatus('unavailable') }
    }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void check(controller.signal)
    const interval = window.setInterval(() => {
      if (lastStatus.current === 'signed-in') void check(controller.signal)
    }, 15000)
    const resume = () => { if (document.visibilityState === 'visible') void check(controller.signal) }
    window.addEventListener('focus', resume)
    document.addEventListener('visibilitychange', resume)
    return () => {
      controller.abort()
      window.clearInterval(interval)
      window.removeEventListener('focus', resume)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [check])
  async function logout() {
    revision.current++
    lastStatus.current = 'signed-out'
    let failed = false
    try { failed = !(await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin' })).ok }
    catch { failed = true }
    lastStatus.current = 'signed-out'
    setStatus('signed-out')
    setLogoutFailed(failed)
  }
  return { status, check, logout, logoutFailed, invalidate: () => { revision.current++; lastStatus.current = 'signed-out'; setStatus('signed-out') } }
}
