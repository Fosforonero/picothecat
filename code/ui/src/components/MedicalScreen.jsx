import StatusCard from './StatusCard.jsx'

function fmt(v, suffix = '') {
  const n = Number(v)
  return Number.isFinite(n) ? `${Math.round(n)}${suffix}` : '—'
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
  if (h <= 0) return `${m} min`
  return `${h}h ${m.toString().padStart(2, '0')}m`
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
        <StatusCard title="Sonno" value={d ? fmtSleep(d.sleepMinutes) : '—'} detail="" />
        <StatusCard title="Distanza" value={d ? fmtKm(d.distanceMeters) : '—'} detail="" />
        <StatusCard title="Calorie" value={d ? fmt(d.calories, ' kcal') : '—'} detail={d?.unlock ?? ''} />
      </div>
    </div>
  )
}

