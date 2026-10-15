import { ArrowLeft, LogOut, MessageCircle } from 'lucide-react'
import { mainLink } from '../config'

export default function Header({ onLogout }: { onLogout?: () => void }) {
  return <header className="header">
    <a className="brand" href={mainLink('/services')}>
      <img src="/vetify_logo.jpg" alt="Vetify" width="36" height="36" />
      <span><strong>Vetify Anatomy</strong><small>Explore pet biology</small></span>
    </a>
    <nav aria-label="Vetify navigation">
      <a className="assistant-link" href={mainLink('/chat')}><MessageCircle size={17} />Ask AI Assistant</a>
      <a href={mainLink('/services')} aria-label="Back to Vetify" title="Back to Vetify"><ArrowLeft size={17} /><span>Back to Vetify</span></a>
      {onLogout && <button className="icon-button" onClick={onLogout} aria-label="Sign out of Anatomy" title="Sign out of Anatomy"><LogOut size={18} /></button>}
    </nav>
  </header>
}
