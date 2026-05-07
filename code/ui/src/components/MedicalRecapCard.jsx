import { medicalMock } from '../data/medicalMock.js'

function fmtInt(v) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n).toLocaleString('it-IT') : '—'
}

function fmtTempC(v) {
  const n = Number(v)
  return Number.isFinite(n) ? `${n.toFixed(1).replace('.', ',')}°C` : '—'
}

export default function MedicalRecapCard() {
  const d = medicalMock

  return (
    <article className="medical-recap" aria-label="Riepilogo salute">
      <div className="medical-recap__head">
        <div className="medical-recap__title">Salute</div>
        <div className="medical-recap__hint">Oggi</div>
      </div>

      <div className="medical-recap__grid">
        <div className="medical-recap__cell">
          <div className="medical-recap__k">BPM</div>
          <div className="medical-recap__v">{fmtInt(d.bpm)}</div>
        </div>
        <div className="medical-recap__cell">
          <div className="medical-recap__k">Passi</div>
          <div className="medical-recap__v">{fmtInt(d.steps)}</div>
        </div>
        <div className="medical-recap__cell">
          <div className="medical-recap__k">Calorie</div>
          <div className="medical-recap__v">{fmtInt(d.calories)}</div>
        </div>
        <div className="medical-recap__cell">
          <div className="medical-recap__k">Temp</div>
          <div className="medical-recap__v">{fmtTempC(d.bodyTempC)}</div>
        </div>
      </div>
    </article>
  )
}

