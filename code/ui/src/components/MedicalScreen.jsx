import StatusCard from './StatusCard.jsx'

function fmt(v, suffix = '') {
  const n = Number(v)
  return Number.isFinite(n) ? `${Math.round(n)}${suffix}` : '—'
}

function Sparkline({ points, stroke = 'currentColor', fill = 'transparent' }) {
  const ys = points
    .map((p) => Number(p))
    .filter((n) => Number.isFinite(n))
    .slice(-48)
  if (ys.length < 2) return null

  const min = Math.min(...ys)
  const max = Math.max(...ys)
  const w = 220
  const h = 44
  const pad = 2
  const span = max - min || 1

  const d = ys
    .map((y, i) => {
      const x = (i / (ys.length - 1)) * (w - pad * 2) + pad
      const yy = h - pad - ((y - min) / span) * (h - pad * 2)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${yy.toFixed(2)}`
    })
    .join(' ')

  const area = `${d} L${w - pad},${h - pad} L${pad},${h - pad} Z`

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height="44"
      aria-hidden
    >
      <path d={area} fill={fill} opacity="0.55" />
      <path d={d} fill="none" stroke={stroke} strokeWidth="2.6" />
    </svg>
  )
}

function MetricDetail({ points, stroke, fill, caption }) {
  return (
    <div className="status-card__spark">
      <Sparkline points={points} stroke={stroke} fill={fill} />
      {caption ? <div className="status-card__spark-caption">{caption}</div> : null}
    </div>
  )
}

function fmtSteps(v) {
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
  if (h <= 0) return `${m} min`
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

export default function MedicalScreen({ medical }) {
  const d = medical?.data ?? null
  const status = medical?.status ?? 'loading'
  const history = medical?.history ?? []

  const series = (key) => history.map((h) => h?.[key]).filter((v) => v != null)
  return (
    <div className="medical-screen">
      <div className="medical-screen__head">
        <div className="medical-screen__title">Salute</div>
        <div className="medical-screen__hint">
          {status === 'loading'
            ? 'Caricamento…'
            : status === 'error'
              ? medical?.lastError
                ? `Offline (${medical.lastError})`
                : 'Offline'
              : d?.ts
                ? `Aggiornato · ${new Date(d.ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
                : 'Oggi'}
        </div>
      </div>
      <div className="medical-screen__grid">
        <div className="medical-screen__wide">
          <StatusCard
            title="Passi"
            value={d ? fmtSteps(d.steps) : '—'}
            detail={
              status === 'ready' ? (
                <MetricDetail
                  points={series('steps')}
                  stroke="rgba(96,165,250,0.95)"
                  fill="rgba(96,165,250,0.18)"
                  caption="Oggi"
                />
              ) : (
                ''
              )
            }
            variant="ambient"
            personality="signal"
          />
        </div>
        <StatusCard
          title="Frequenza cardiaca"
          value={d ? fmt(d.bpm) : '—'}
          detail={
            status === 'ready' ? (
              <MetricDetail
                points={series('bpm')}
                stroke="rgba(255,92,92,0.95)"
                fill="rgba(255,92,92,0.16)"
                caption="Trend"
              />
            ) : (
              ''
            )
          }
        />
        <StatusCard title="Sonno" value={d ? fmtSleep(d.sleepMinutes) : '—'} detail="" />
        <StatusCard
          title="Distanza"
          value={d ? fmtKm(d.distanceMeters) : '—'}
          detail={
            status === 'ready' ? (
              <MetricDetail
                points={series('distanceMeters')}
                stroke="rgba(120,210,255,0.95)"
                fill="rgba(120,210,255,0.16)"
                caption="Trend"
              />
            ) : (
              ''
            )
          }
        />
        <StatusCard title="Calorie" value={d ? fmt(d.calories, ' kcal') : '—'} detail={d?.unlock ?? ''} />
      </div>
    </div>
  )
}

