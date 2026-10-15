import { useEffect, useState } from 'react'
import { ANIMALS, BODY_SYSTEMS, type AnimalId, type SystemId } from './types/anatomy'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Viewer from './components/Viewer'
import SignIn from './components/SignIn'
import dog from './data/dog'
import cat from './data/cat'
import bird from './data/bird'
import { useSession } from './use-session'

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
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    const update = () => setCurrent(selection())
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])
  function change(animal: AnimalId, system: SystemId) {
    setCurrent({ animal, system })
    history.pushState(null, '', `/${animal}/${system}`)
  }
  const signedIn = session.status === 'signed-in' && !leaving
  return <div className="app">
    <Header onLogout={signedIn ? () => {
      setLeaving(true)
      void session.logout().finally(() => setLeaving(false))
    } : undefined} />
    {signedIn ? <main className="workspace">
      <Sidebar animal={current.animal} system={current.system} onChange={change} />
      <Viewer animal={current.animal} system={current.system} hotspots={HOTSPOTS[current.animal][current.system]}
        onUnauthorized={session.invalidate} />
    </main> : <SignIn status={leaving ? 'loading' : session.status} onRetry={() => void session.check()} logoutFailed={session.logoutFailed} />}
  </div>
}
