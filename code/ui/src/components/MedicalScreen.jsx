import { useId } from 'react'
import StatusCard from './StatusCard.jsx'

function fmt(v, suffix = '') {
  const n = Number(v)
  return Number.isFinite(n) ? `${Math.round(n)}${suffix}` : '—'
}

function linePath(points) {
  if (points.length < 2) return ''
  const out = [`M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`]
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    out.push(
      `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`,
    )
  }
  return out.join(' ')
}

function Sparkline({
  points,
  stroke = 'currentColor',
  fill = 'transparent',
  height = 58,
  strokeWidth = 2.8,
  dot = true,
  grid = true,
}) {
  const uid = useId()
  const ys = points
    .map((p) => Number(p))
    .filter((n) => Number.isFinite(n))
    .slice(-48)
  if (ys.length < 2) return null

  const min = Math.min(...ys)
  const max = Math.max(...ys)
  const w = 320
  const h = height
  const pad = 6
  const span = max - min || 1

  const pts = ys.map((y, i) => {
    const x = (i / (ys.length - 1)) * (w - pad * 2) + pad
    const yy = h - pad - ((y - min) / span) * (h - pad * 2)
    return [x, yy]
  })

  const d = linePath(pts)
  const last = pts[pts.length - 1]

  const area = `${d} L${w - pad},${h - pad} L${pad},${h - pad} Z`
  const gid = `spark-${uid}`

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.55" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {grid ? (
        <>
          <path
            d={`M${pad},${pad + (h - pad * 2) * 0.33} H${w - pad}`}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="1"
          />
          <path
            d={`M${pad},${pad + (h - pad * 2) * 0.66} H${w - pad}`}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        </>
      ) : null}
      <path d={area} fill={fill} opacity="0.55" />
      <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
      {dot ? (
        <>
          <circle cx={last[0]} cy={last[1]} r="5.2" fill={stroke} opacity="0.18" />
          <circle cx={last[0]} cy={last[1]} r="2.6" fill={stroke} />
        </>
      ) : null}
    </svg>
  )
}

function MetricDetail({ points, stroke, fill, caption, height }) {
  return (
    <div className="status-card__spark">
      <Sparkline points={points} stroke={stroke} fill={fill} height={height} />
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
                  height={72}
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
                height={58}
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
                height={58}
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

