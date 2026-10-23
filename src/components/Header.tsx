import { mainLink } from '../config'

export default function Header({ onLogout }: { onLogout?: () => void }) {
  return <header className="header">
    <a className="brand" href={mainLink('/services')}>
      <img src="/vetify_logo.jpg" alt="Vetify" width="36" height="36" />
      <strong>Anatomy</strong>
    </a>
    <nav aria-label="Vetify navigation">
      <a className="assistant-link" href={mainLink('/chat')}>Ask Vetify</a>
      <a href={mainLink('/services')}>Back to Vetify</a>
      {onLogout && <button className="text-button" onClick={onLogout} aria-label="Sign out of Anatomy">Sign out</button>}
    </nav>
  </header>
}
