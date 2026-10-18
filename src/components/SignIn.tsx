import { LockKeyhole, RefreshCw } from 'lucide-react'
import type { SessionStatus } from '../use-session'

export default function SignIn({ status, onRetry }: {
  status: SessionStatus; onRetry: () => void
}) {
  const failure = new URLSearchParams(location.search).get('auth')
  return <main className="signin">
    <LockKeyhole className="lock-icon" size={32} aria-hidden="true" />
    <h1>Vetify Anatomy</h1>
    <p>Connecting to your Vetify session...</p>
    {status === 'loading' ? <p role="status">Checking your sign-in...</p> : <>
      {(status === 'unavailable' || failure === 'unavailable') && <p className="notice" role="status">Vetify sign-in is unavailable. Try again later.</p>}
      {failure === 'failed' && <p className="notice" role="alert">Sign-in could not be completed. Please try again.</p>}
      {status === 'unavailable' && <button className="text-button" onClick={onRetry}><RefreshCw size={16} />Try again</button>}
    </>}
  </main>
}
