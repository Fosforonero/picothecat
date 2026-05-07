function fmtInt(v) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n).toLocaleString('it-IT') : '—'
}

function fmtKm(meters) {
  const n = Number(meters)
  if (!Number.isFinite(n)) return '—'
  const km = n / 1000
  const s = km >= 10 ? km.toFixed(0) : km.toFixed(1)
  return `${s.replace('.', ',')} km`
}

function fmtSleep(mins) {
  const n = Number(mins)
  if (!Number.isFinite(n)) return '—'
  const h = Math.floor(n / 60)
  const m = Math.round(n % 60)
  if (h <= 0) return `${m}m`
  return `${h}h ${m.toString().padStart(2, '0')}m`
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
          <div className="medical-recap__k">Sonno</div>
          <div className="medical-recap__v">{fmtSleep(d.sleepMinutes)}</div>
        </div>
        <div className="medical-recap__cell">
          <div className="medical-recap__k">Distanza</div>
          <div className="medical-recap__v">{fmtKm(d.distanceMeters)}</div>
        </div>
        <div className="medical-recap__cell">
          <div className="medical-recap__k">Calorie</div>
          <div className="medical-recap__v">{fmtInt(d.calories)}</div>
        </div>
      </div>
      {d.unlock ? <div className="medical-recap__unlock">{d.unlock}</div> : null}
    </article>
  )
}

