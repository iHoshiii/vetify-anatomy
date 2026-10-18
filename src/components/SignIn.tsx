import { LockKeyhole, LogIn, RefreshCw } from 'lucide-react'
import type { SessionStatus } from '../use-session'

export default function SignIn({ status, onRetry, logoutFailed }: {
  status: SessionStatus; onRetry: () => void; logoutFailed: boolean
}) {
  const failure = new URLSearchParams(location.search).get('auth')
  return <main className="signin">
    <LockKeyhole className="lock-icon" size={32} aria-hidden="true" />
    <h1>Vetify Anatomy</h1>
    <p>Sign in to view dog, cat, and bird anatomy.</p>
    {status === 'loading' ? <p role="status">Checking your sign-in...</p> : <>
      {(status === 'unavailable' || failure === 'unavailable') && <p className="notice" role="status">Vetify sign-in is unavailable. Try again later.</p>}
      {failure === 'failed' && <p className="notice" role="alert">Sign-in could not be completed. Please try again.</p>}
      {logoutFailed && <p className="notice" role="alert">You have left Anatomy. Sign-out could not be confirmed with Vetify.</p>}
      <a className="primary-button" href={`/auth/login?returnTo=${encodeURIComponent(location.pathname)}`}><LogIn size={18} />Sign in with Vetify</a>
      {status === 'unavailable' && <button className="text-button" onClick={onRetry}><RefreshCw size={16} />Try again</button>}
    </>}
  </main>
}
