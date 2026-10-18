import { ANIMALS, BODY_SYSTEMS, type AnimalId, type SystemId } from '../types/anatomy'

export default function Sidebar({ animal, system, onChange }: {
  animal: AnimalId; system: SystemId; onChange: (animal: AnimalId, system: SystemId) => void
}) {
  return <aside className="sidebar" aria-label="Anatomy selections">
    <section>
      <h2>Species</h2>
      <div className="species" role="group" aria-label="Species">
        {ANIMALS.map(item => <button key={item.id} aria-pressed={animal === item.id}
          onClick={() => onChange(item.id, system)}>
          <span className="species-icon" aria-hidden="true">{item.icon}</span><span>{item.name}</span>
        </button>)}
      </div>
    </section>
    <section className="systems-section">
      <h2>Body System</h2>
      <div className="systems" role="group" aria-label="Body system">
        {BODY_SYSTEMS.map(item => <button key={item.id} aria-pressed={system === item.id}
          onClick={() => onChange(animal, item.id)}>
          <span className="system-icon" aria-hidden="true">{item.icon}</span><span>{item.name}</span>
        </button>)}
      </div>
    </section>
  </aside>
}
