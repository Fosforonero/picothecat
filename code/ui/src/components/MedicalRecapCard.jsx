function fmtInt(v) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n).toLocaleString('it-IT') : '—'
}

function fmtTempC(v) {
  const n = Number(v)
  return Number.isFinite(n) ? `${n.toFixed(1).replace('.', ',')}°C` : '—'
}

export default function MedicalRecapCard({ medical, status = 'ready' }) {
  const d = medical ?? {}

  return (
    <article className="medical-recap" aria-label="Riepilogo salute">
      <div className="medical-recap__head">
        <div className="medical-recap__title">Salute</div>
        <div className="medical-recap__hint">
          {status === 'loading' ? '…' : status === 'error' ? 'offline' : 'Oggi'}
        </div>
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
      {d.unlock ? <div className="medical-recap__unlock">{d.unlock}</div> : null}
    </article>
  )
}

