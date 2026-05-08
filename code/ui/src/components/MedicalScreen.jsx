import { useId } from 'react'
import StatusCard from './StatusCard.jsx'

function fmt(v, suffix = '') {
  const n = Number(v)
  return Number.isFinite(n) ? `${Math.round(n)}${suffix}` : '—'
}

function fmtTimeHM(ms) {
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
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

function LineChart({
  points,
  stroke = 'currentColor',
  height = 140,
  strokeWidth = 3,
  dot = true,
  grid = true,
  unit = '',
}) {
  const uid = useId()
  const raw = Array.isArray(points) ? points : []
  const ptsRaw = raw
    .map((p) => ({ t: Number(p?.t), v: Number(p?.v) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))
    .slice(-96)
  if (ptsRaw.length < 2) return null

  const minT = Math.min(...ptsRaw.map((p) => p.t))
  const maxT = Math.max(...ptsRaw.map((p) => p.t))
  const minV = Math.min(...ptsRaw.map((p) => p.v))
  const maxV = Math.max(...ptsRaw.map((p) => p.v))

  const w = 640
  const h = height
  const padL = 44
  const padR = 10
  const padT = 10
  const padB = 26
  const spanT = maxT - minT || 1
  const spanV = maxV - minV || 1

  const pts = ptsRaw.map((p) => {
    const x = ((p.t - minT) / spanT) * (w - padL - padR) + padL
    const yy = h - padB - ((p.v - minV) / spanV) * (h - padT - padB)
    return [x, yy]
  })

  const d = linePath(pts)
  const last = pts[pts.length - 1]

  const area = `${d} L${w - padR},${h - padB} L${padL},${h - padB} Z`
  const gid = `spark-${uid}`

  const yTop = Math.round(maxV)
  const yMid = Math.round((minV + maxV) / 2)
  const yBot = Math.round(minV)
  const xL = fmtTimeHM(minT)
  const xR = fmtTimeHM(maxT)

  return (
    <svg
      className="linechart"
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.55" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {grid ? (
        <>
          <path
            d={`M${padL},${padT + (h - padT - padB) * 0.33} H${w - padR}`}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="1"
          />
          <path
            d={`M${padL},${padT + (h - padT - padB) * 0.66} H${w - padR}`}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        </>
      ) : null}
      <path d={area} fill={`url(#${gid})`} opacity="1" />
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {dot ? (
        <>
          <circle cx={last[0]} cy={last[1]} r="5.2" fill={stroke} opacity="0.18" />
          <circle cx={last[0]} cy={last[1]} r="2.6" fill={stroke} />
        </>
      ) : null}

      <text x={padL - 8} y={padT + 2} textAnchor="end" className="linechart__y">
        {yTop}
        {unit}
      </text>
      <text
        x={padL - 8}
        y={padT + (h - padT - padB) * 0.66}
        textAnchor="end"
        className="linechart__y"
      >
        {yMid}
        {unit}
      </text>
      <text x={padL - 8} y={h - padB} textAnchor="end" className="linechart__y">
        {yBot}
        {unit}
      </text>
      <text x={padL} y={h - 8} textAnchor="start" className="linechart__x">
        {xL}
      </text>
      <text x={w - padR} y={h - 8} textAnchor="end" className="linechart__x">
        {xR}
      </text>
    </svg>
  )
}

function MetricDetail({ points, stroke, caption, height, unit }) {
  return (
    <div className="status-card__spark">
      <LineChart points={points} stroke={stroke} height={height} unit={unit} />
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

  const series = (key) =>
    history
      .map((h) => ({ t: h?.t, v: h?.[key] }))
      .filter((p) => p.t != null && p.v != null)
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
                  caption="Oggi"
                  height={150}
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
                caption="Trend"
                height={130}
                unit=" bpm"
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
                caption="Trend"
                height={130}
                unit=" m"
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

