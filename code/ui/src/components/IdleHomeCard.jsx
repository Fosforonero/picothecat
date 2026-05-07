import { homeMock } from '../data/homeMock.js'

/** Card Casa idle: titolo principale + fatti strutturati (mock). */
export default function IdleHomeCard() {
  return (
    <article className="idle-home-card" aria-label="Casa">
      <div className="idle-home-card__eyebrow">Casa</div>
      <h3 className="idle-home-card__headline">{homeMock.label}</h3>
      <dl className="idle-home-card__facts">
        {homeMock.facts.map((f) => (
          <div key={f.label} className="idle-home-card__row">
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}
