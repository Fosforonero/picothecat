import AssistantMain from './AssistantMain.jsx'
import StatusCard from './StatusCard.jsx'
import { homeMock, homeCompactSummary } from '../data/homeMock.js'

function assistantLine(status) {
  if (status === 'online') return 'Pronto'
  if (status === 'offline') return 'Non raggiungibile'
  return 'Verifica…'
}

export default function ActiveScreen({ health, weather, onQuickAction }) {
  return (
    <div className="active-screen">
      <div className="active-screen__main">
        <AssistantMain />
      </div>

      <aside className="active-screen__side">
        <p className="side-heading">In sintesi</p>
        <StatusCard
          title="Assistente"
          value={assistantLine(health.status)}
          detail={
            health.status === 'offline' && health.lastError
              ? health.lastError
              : undefined
          }
          healthStatus={health.status}
        />
        <StatusCard
          title="Meteo"
          value={weather.summary}
          detail={weather.highLow}
        />

        <p className="side-heading">Scene</p>
        <div className="quick-actions">
          <button
            type="button"
            className="quick-action"
            onClick={() => onQuickAction?.('relax')}
          >
            Relax
          </button>
          <button
            type="button"
            className="quick-action"
            onClick={() => onQuickAction?.('away')}
          >
            Uscita
          </button>
          <button
            type="button"
            className="quick-action"
            onClick={() => onQuickAction?.('night')}
          >
            Notte
          </button>
        </div>

        <StatusCard
          title="Casa"
          value={homeMock.label}
          detail={homeCompactSummary(homeMock)}
        />
      </aside>

      <span className="visually-hidden" aria-live="polite">
        Assistente: {assistantLine(health.status)}
      </span>
    </div>
  )
}
