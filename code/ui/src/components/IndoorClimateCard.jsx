import { hvacModeLabel } from '../data/climateMock.js'

/**
 * Temperatura interna + stato HVAC con accento colore (mock).
 */
export default function IndoorClimateCard({ temperature, mode }) {
  const label = hvacModeLabel(mode)

  return (
    <article
      className={`indoor-climate-card indoor-climate-card--mode-${mode}`}
      aria-label={`In casa, ${temperature}, ${label}`}
    >
      <div className="indoor-climate-card__top">
        <div className="indoor-climate-card__label">In casa</div>
        <span className="indoor-climate-card__pill">{label}</span>
      </div>
      <div className="indoor-climate-card__temp">{temperature}</div>
      <div className="indoor-climate-card__hint">
        Temperatura percepita · stima
      </div>
    </article>
  )
}
