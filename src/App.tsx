import { useEffect, useState } from 'react'
import type { AnimalId, SystemId } from './types/anatomy'
import { readSelection, rememberSelection } from './selection'
import Sidebar from './components/Sidebar'
import Viewer from './components/Viewer'
import SignIn from './components/SignIn'
import dog from './data/dog'
import cat from './data/cat'
import bird from './data/bird'
import { useSession } from './use-session'
import { mainAnatomyUrl, notifyMain } from './integration'
import MainShell from './components/MainShell'

const HOTSPOTS = { dog, cat, bird }
const selection = () => readSelection(location.pathname)

function EmbeddedViewer() {
  const session = useSession()
  const [current, setCurrent] = useState(selection)
  const failure = new URLSearchParams(location.search).get('auth')
  useEffect(() => {
    if (session.status !== 'signed-in') return
    rememberSelection(current)
    if (['/', '/anatomy', '/anatomy/'].includes(location.pathname)) {
      history.replaceState(null, '', `/${current.animal}/${current.system}${location.search}`)
    }
  }, [current, session.status])
  useEffect(() => {
    if (session.status === 'signed-in' && session.verified) {
      notifyMain('ready')
    } else if (session.status === 'signed-out' && !failure) {
      if (window.parent !== window) notifyMain('authenticate')
      else location.replace(mainAnatomyUrl(location.pathname))
    }
  }, [failure, session.status, session.verified])
  useEffect(() => {
    const update = () => setCurrent(selection())
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])
  function change(animal: AnimalId, system: SystemId) {
    setCurrent({ animal, system })
    history.pushState(null, '', `/${animal}/${system}?embed=1`)
  }
  const signedIn = session.status === 'signed-in'
  return <div className="app">
    {signedIn ? <main className="workspace">
      <Sidebar animal={current.animal} system={current.system} onChange={change} />
      <Viewer key={`${current.animal}/${current.system}`} animal={current.animal} system={current.system} hotspots={HOTSPOTS[current.animal][current.system]}
        onUnauthorized={session.invalidate} />
    </main> : <SignIn status={session.status} onRetry={() => void session.check()} />}
  </div>
}

export default function App() {
  const embedded = window.parent !== window || new URLSearchParams(location.search).get('embed') === '1'
  return embedded ? <EmbeddedViewer /> : <MainShell />
}
