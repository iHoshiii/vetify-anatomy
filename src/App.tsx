import { useEffect, useState } from 'react'
import { ANIMALS, BODY_SYSTEMS, type AnimalId, type SystemId } from './types/anatomy'
import Sidebar from './components/Sidebar'
import Viewer from './components/Viewer'
import SignIn from './components/SignIn'
import dog from './data/dog'
import cat from './data/cat'
import bird from './data/bird'
import { useSession } from './use-session'
import { mainAnatomyUrl, notifyMain } from './integration'

const HOTSPOTS = { dog, cat, bird }
function selection() {
  const parts = location.pathname.replace(/^\/anatomy/, '').split('/').filter(Boolean)
  const animal = ANIMALS.find(item => item.id === parts[0])?.id ?? 'dog'
  const system = BODY_SYSTEMS.find(item => item.id === parts[1])?.id ?? 'skeletal'
  return { animal, system }
}

export default function App() {
  const session = useSession()
  const [current, setCurrent] = useState(selection)
  const embedded = window.parent !== window || new URLSearchParams(location.search).get('embed') === '1'
  const failure = new URLSearchParams(location.search).get('auth')
  useEffect(() => {
    if (!embedded) {
      location.replace(mainAnatomyUrl(location.pathname, failure))
    } else if (session.status === 'signed-in') {
      notifyMain('ready')
    } else if (session.status === 'signed-out' && !failure) {
      if (window.parent !== window) notifyMain('authenticate')
      else location.replace(mainAnatomyUrl(location.pathname))
    }
  }, [embedded, failure, session.status])
  useEffect(() => {
    const update = () => setCurrent(selection())
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])
  function change(animal: AnimalId, system: SystemId) {
    setCurrent({ animal, system })
    history.pushState(null, '', `/${animal}/${system}?embed=1`)
  }
  const signedIn = embedded && session.status === 'signed-in'
  return <div className="app">
    {signedIn ? <main className="workspace">
      <Sidebar animal={current.animal} system={current.system} onChange={change} />
      <Viewer animal={current.animal} system={current.system} hotspots={HOTSPOTS[current.animal][current.system]}
        onUnauthorized={session.invalidate} />
    </main> : <SignIn status={session.status} onRetry={() => void session.check()} />}
  </div>
}
