import StatusCard from './StatusCard.jsx'

function fmt(v, suffix = '') {
  const n = Number(v)
  return Number.isFinite(n) ? `${Math.round(n)}${suffix}` : '—'
}

export default function MedicalScreen({ medical }) {
  const d = medical?.data ?? null
  const status = medical?.status ?? 'loading'
  return (
    <div className="medical-screen">
      <p className="side-heading">Dati medici</p>
      <div className="medical-screen__grid">
        <StatusCard
          title="Frequenza cardiaca"
          value={d ? fmt(d.bpm) : '—'}
          detail={status === 'loading' ? 'Caricamento…' : status === 'error' ? 'Offline' : d?.ts ?? ''}
        />
        <StatusCard title="Passi" value={d ? fmt(d.steps) : '—'} detail={d?.unlock ?? ''} />
        <StatusCard title="Calorie" value={d ? fmt(d.calories, ' kcal') : '—'} detail="Sblocco cibo" />
        <StatusCard title="Temperatura" value={d?.bodyTempC != null ? `${Number(d.bodyTempC).toFixed(1).replace('.', ',')}°C` : '—'} detail="" />
      </div>
    </div>
  )
}

