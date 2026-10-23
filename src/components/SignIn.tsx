import { LoaderCircle, RefreshCw } from 'lucide-react'
import type { SessionStatus } from '../use-session'

export default function SignIn({ status, onRetry }: {
  status: SessionStatus; onRetry: () => void
}) {
  const failure = new URLSearchParams(location.search).get('auth')
  if (status !== 'unavailable' && failure !== 'failed' && failure !== 'unavailable') {
    return <main className="signin"><div role="status" aria-label="Loading">
      <LoaderCircle className="loading-spinner" size={32} aria-hidden="true" />
    </div></main>
  }
  return <main className="signin">
    <h1>Vetify Anatomy</h1>
    {(status === 'unavailable' || failure === 'unavailable') && <p className="notice" role="status">Vetify sign-in is unavailable. Try again later.</p>}
    {failure === 'failed' && <p className="notice" role="alert">Sign-in could not be completed. Please try again.</p>}
    {status === 'unavailable' && <button className="text-button" onClick={onRetry}><RefreshCw size={16} />Try again</button>}
  </main>
}
