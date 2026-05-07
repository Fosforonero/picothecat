const ACTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'chat', label: 'Chat' },
  { id: 'voice', label: 'Voce' },
  { id: 'actions', label: 'Stato' },
  { id: 'medical', label: 'Salute' },
  { id: 'settings', label: 'Impostazioni' },
]

export default function BottomDock({ activeId, onAction }) {
  return (
    <nav className="bottom-dock" aria-label="Navigazione principale">
      {ACTIONS.map((a) => (
        <button
          key={a.id}
          type="button"
          className={
            activeId === a.id ? 'dock-btn dock-btn--current' : 'dock-btn'
          }
          onClick={() => onAction?.(a.id)}
        >
          {a.label}
        </button>
      ))}
    </nav>
  )
}
