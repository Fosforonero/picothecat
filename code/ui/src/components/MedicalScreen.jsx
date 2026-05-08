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

/**
 * Monotone cubic spline path (Fritsch-Carlson).
 * Evita overshoot/loop che “spaccano” la curva con pochi punti o gap.
 * @param {Array<[number, number]>} pts
 */
function linePath(pts) {
  if (pts.length < 2) return ''
  const n = pts.length
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])

  const dx = new Array(n - 1)
  const dy = new Array(n - 1)
  const m = new Array(n - 1)
  for (let i = 0; i < n - 1; i += 1) {
    dx[i] = xs[i + 1] - xs[i]
    dy[i] = ys[i + 1] - ys[i]
    m[i] = dx[i] !== 0 ? dy[i] / dx[i] : 0
  }

  const t = new Array(n)
  t[0] = m[0]
  t[n - 1] = m[n - 2]
  for (let i = 1; i < n - 1; i += 1) {
    if (m[i - 1] * m[i] <= 0) {
      t[i] = 0
    } else {
      const w1 = 2 * dx[i] + dx[i - 1]
      const w2 = dx[i] + 2 * dx[i - 1]
      t[i] = (w1 + w2) / (w1 / m[i - 1] + w2 / m[i])
    }
  }

  // Clamp tangents to prevent overshoot.
  for (let i = 0; i < n - 1; i += 1) {
    if (m[i] === 0) {
      t[i] = 0
      t[i + 1] = 0
      continue
    }
    const a = t[i] / m[i]
    const b = t[i + 1] / m[i]
    const s = a * a + b * b
    if (s > 9) {
      const scale = 3 / Math.sqrt(s)
      t[i] = scale * a * m[i]
      t[i + 1] = scale * b * m[i]
    }
  }

  const out = [`M${xs[0].toFixed(2)},${ys[0].toFixed(2)}`]
  for (let i = 0; i < n - 1; i += 1) {
    const x0 = xs[i]
    const y0 = ys[i]
    const x1 = xs[i + 1]
    const y1 = ys[i + 1]
    const h = x1 - x0 || 1
    const c1x = x0 + h / 3
    const c1y = y0 + (t[i] * h) / 3
    const c2x = x1 - h / 3
    const c2y = y1 - (t[i + 1] * h) / 3
    out.push(
      `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${x1.toFixed(2)},${y1.toFixed(2)}`,
    )
  }
  return out.join(' ')
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n))
}

function StepsIntradayChart({ rows, dayStartMs, dayEndMs, height = 160 }) {
  const uid = useId()
  const raw = Array.isArray(rows) ? rows : []

  const pts = raw
    .map((r) => {
      const t = new Date(r?.receivedAt || r?.collectedAtMillis || 0).getTime()
      const steps = Number(r?.steps ?? r?.stepCount ?? r?.stepsCount)
      const stepsDelta = Number(r?.stepsDelta ?? r?.deltaSteps ?? r?.steps_delta)
      if (!Number.isFinite(t) || !Number.isFinite(steps)) return null
      if (t < dayStartMs || t > dayEndMs) return null
      return { t, steps, stepsDelta: Number.isFinite(stepsDelta) ? stepsDelta : null }
    })
    .filter(Boolean)
    .sort((a, b) => a.t - b.t)

  if (pts.length < 2) return null

  // Delta per sync: usa stepsDelta se presente, altrimenti diff del cumulativo.
  for (let i = 0; i < pts.length; i += 1) {
    if (pts[i].stepsDelta == null) {
      const prev = i > 0 ? pts[i - 1].steps : 0
      const d = pts[i].steps - prev
      pts[i].stepsDelta = Number.isFinite(d) ? Math.max(0, d) : 0
    }
  }

  const w = 640
  const h = height
  const padL = 14
  const padR = 14
  const padT = 10
  const padB = 26
  const spanT = dayEndMs - dayStartMs || 1

  const maxCum = Math.max(...pts.map((p) => p.steps))
  const minCum = Math.min(...pts.map((p) => p.steps))
  const spanCum = maxCum - minCum || 1
  const maxDelta = Math.max(...pts.map((p) => p.stepsDelta || 0), 1)

  const xOf = (t) => ((t - dayStartMs) / spanT) * (w - padL - padR) + padL
  const yCum = (v) => h - padB - ((v - minCum) / spanCum) * (h - padT - padB)
  const yDelta = (v) => h - padB - (v / maxDelta) * (h - padT - padB)

  const linePts = pts.map((p) => [xOf(p.t), yCum(p.steps)])
  const dLine = linePath(linePts)
  const last = linePts[linePts.length - 1]

  const barW = clamp((w - padL - padR) / Math.max(pts.length * 1.6, 12), 6, 18)
  const gid = `steps-${uid}`

  return (
    <svg
      className="linechart"
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>

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

      {/* bars: delta steps */}
      {pts.map((p, i) => {
        const x = xOf(p.t) - barW / 2
        const y = yDelta(p.stepsDelta || 0)
        const hh = h - padB - y
        return (
          <rect
            key={`${p.t}-${i}`}
            x={x.toFixed(2)}
            y={y.toFixed(2)}
            width={barW.toFixed(2)}
            height={hh.toFixed(2)}
            rx="4"
            fill="rgba(96,165,250,0.28)"
          />
        )
      })}

      {/* line: cumulative steps */}
      <path d={dLine} fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="5.2" fill="#34d399" opacity="0.18" />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill="#34d399" />

      <text x={padL} y={h - 8} textAnchor="start" className="linechart__x">
        00:00
      </text>
      <text x={w - padR} y={h - 8} textAnchor="end" className="linechart__x">
        23:59
      </text>
    </svg>
  )
}

function LineChart({
  points,
  stroke = 'currentColor',
  height = 140,
  strokeWidth = 3,
  dot = true,
  grid = true,
  unit = '',
  domainStart,
  domainEnd,
}) {
  const uid = useId()
  const raw = Array.isArray(points) ? points : []
  const ptsRaw = raw
    .map((p) => ({ t: Number(p?.t), v: Number(p?.v) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))
    .slice(-96)
  if (ptsRaw.length < 2) return null

  // Ordina e deduplica per timestamp (evita path “indietro” che sembra discontinuo).
  const sorted = ptsRaw
    .slice()
    .sort((a, b) => a.t - b.t)
    .filter((p, i, arr) => i === 0 || p.t !== arr[i - 1].t)

  const minT = Number.isFinite(Number(domainStart))
    ? Number(domainStart)
    : Math.min(...sorted.map((p) => p.t))
  const maxT = Number.isFinite(Number(domainEnd))
    ? Number(domainEnd)
    : Math.max(...sorted.map((p) => p.t))
  const minV = Math.min(...sorted.map((p) => p.v))
  const maxV = Math.max(...sorted.map((p) => p.v))

  const w = 640
  const h = height
  const padL = 44
  const padR = 10
  const padT = 10
  const padB = 26
  const spanT = maxT - minT || 1
  const spanV = maxV - minV || 1

  const pts = sorted.map((p) => {
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
      preserveAspectRatio="none"
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

function MetricDetail({ points, stroke, caption, height, unit, domainStart, domainEnd }) {
  return (
    <div className="status-card__spark">
      <LineChart
        points={points}
        stroke={stroke}
        height={height}
        unit={unit}
        domainStart={domainStart}
        domainEnd={domainEnd}
      />
      {caption ? <div className="status-card__spark-caption">{caption}</div> : null}
    </div>
  )
}

function fmtSteps(v) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n).toLocaleString('it-IT') : '—'
}

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
  if (h <= 0) return `${m} min`
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

function normalizeSleepStageKey(stage) {
  const s = String(stage || '').toLowerCase()
  if (s.includes('rem')) return 'rem'
  if (s.includes('deep') || s.includes('prof')) return 'deep'
  if (s.includes('light') || s.includes('legg')) return 'light'
  if (s.includes('awake') || s.includes('sveg')) return 'awake'
  return 'light'
}

function SleepStagesBar({ stages }) {
  const segs = Array.isArray(stages) ? stages : []
  const parsed = segs
    .map((x) => {
      const start = new Date(String(x.start)).getTime()
      const end = new Date(String(x.end)).getTime()
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null
      return { k: normalizeSleepStageKey(x.stage), start, end }
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start)

  if (parsed.length < 2) return null

  const t0 = parsed[0].start
  const t1 = parsed[parsed.length - 1].end
  const span = Math.max(1, t1 - t0)

  return (
    <div className="sleepbar" aria-hidden>
      <div className="sleepbar__legend">
        <span className="sleepbar__l sleepbar__l--light">Leggero</span>
        <span className="sleepbar__l sleepbar__l--awake">Sveglio</span>
        <span className="sleepbar__l sleepbar__l--deep">Profondo</span>
        <span className="sleepbar__l sleepbar__l--rem">REM</span>
      </div>
      <div className="sleepbar__track">
        {parsed.map((p, i) => (
          <span
            key={`${p.k}-${p.start}-${i}`}
            className={`sleepbar__seg sleepbar__seg--${p.k}`}
            style={{
              left: `${((p.start - t0) / span) * 100}%`,
              width: `${((p.end - p.start) / span) * 100}%`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function fmtPct(v) {
  const n = Number(v)
  return Number.isFinite(n) ? `${Math.round(n)}%` : '—'
}

function vo2Category(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  if (n < 35) return 'Scarso'
  if (n < 42) return 'Nella norma'
  if (n < 49) return 'Buono'
  if (n < 55) return 'Molto buono'
  return 'Eccellente'
}

function Donut({ value, total, color = '#34d399', label }) {
  const vRaw = Number(value)
  const tRaw = Number(total)
  const known = Number.isFinite(vRaw) && Number.isFinite(tRaw) && tRaw > 0
  const v = known ? Math.max(0, vRaw) : 0
  const t = known ? tRaw : 1
  const p = known ? Math.max(0, Math.min(1, v / t)) : 0
  const r = 18
  const c = 2 * Math.PI * r
  const dash = `${(c * p).toFixed(2)} ${(c * (1 - p)).toFixed(2)}`
  return (
    <div className="donut">
      <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden>
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="6" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={dash}
          transform="rotate(-90 24 24)"
        />
      </svg>
      <div className="donut__txt">
        <div className="donut__label">{label}</div>
        <div className="donut__v">{known ? `${Math.round(p * 100)}%` : '—'}</div>
      </div>
    </div>
  )
}

function caloriesAchievement(kcal) {
  const n = Number(kcal)
  if (!Number.isFinite(n)) return null
  if (n < 150) return { icon: '💧', label: 'Acqua e buona volontà' }
  if (n < 300) return { icon: '☕', label: 'Caffè (amaro)' }
  if (n < 450) return { icon: '☕🥐', label: 'Cornetto e cappuccino' }
  if (n < 600) return { icon: '🥐', label: 'Brioche con la crema' }
  if (n < 800) return { icon: '🍝', label: 'Carbonara' }
  if (n < 1100) return { icon: '🍕', label: 'Pizza Margherita' }
  if (n < 1400) return { icon: '🥩', label: 'Bistecca alla fiorentina' }
  return { icon: '🏆', label: 'Lasagna intera + tiramisù' }
}

export default function MedicalScreen({ medical }) {
  const d = medical?.data ?? null
  const status = medical?.status ?? 'loading'
  const weekly = medical?.weekly ?? []
  const recent = medical?.recent ?? []
  const today = medical?.today ?? []

  const baseTsMs = d?.ts ? new Date(String(d.ts)).getTime() : Number.NaN
  const baseDay = Number.isFinite(baseTsMs) ? new Date(baseTsMs) : new Date()
  const dayStartMs = new Date(
    baseDay.getFullYear(),
    baseDay.getMonth(),
    baseDay.getDate(),
    0,
    0,
    0,
    0,
  ).getTime()
  const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000 - 1

  const inDay = (t) => Number.isFinite(t) && t >= dayStartMs && t <= dayEndMs

  const tsOf = (r) => {
    const t = new Date(r?.receivedAt || r?.collectedAtMillis || 0).getTime()
    return Number.isFinite(t) ? t : null
  }

  const seriesFrom = (rows, pickV) =>
    (Array.isArray(rows) ? rows : [])
      .map((r) => ({ t: tsOf(r), v: pickV(r) }))
      .filter((p) => p.t != null && p.v != null && Number.isFinite(Number(p.v)) && inDay(p.t))

  const todayISO = new Date().toISOString().slice(0, 10)
  const todayAgg = weekly.find((x) => x?.day === todayISO) ?? null
  const hrStats = todayAgg?.heartRateBpm ?? null
  const kcalToday =
    todayAgg?.caloriesKcal ??
    todayAgg?.kcal ??
    todayAgg?.calories ??
    d?.calories ??
    null
  const activeKcal =
    todayAgg?.activeCaloriesKcal ??
    todayAgg?.active_kcal ??
    todayAgg?.activeCalories ??
    null
  const ach = caloriesAchievement(kcalToday)
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
        <div className="medical-screen__cell medical-screen__cell--steps">
          <StatusCard
            title="Passi"
            value={todayAgg?.steps != null ? fmtSteps(todayAgg.steps) : d ? fmtSteps(d.steps) : '—'}
            detail={
              status === 'ready' ? (
                <div className="status-card__spark">
                  <StepsIntradayChart rows={today} dayStartMs={dayStartMs} dayEndMs={dayEndMs} height={160} />
                  <div className="status-card__spark-caption">Oggi · barre = nuovi passi · linea = totale</div>
                </div>
              ) : (
                ''
              )
            }
            variant="ambient"
            personality="signal"
          />
        </div>
        <div className="medical-screen__cell medical-screen__cell--bpm">
          <StatusCard
            title="Frequenza cardiaca"
            value={d ? fmt(d.bpm) : '—'}
            detail={
              status === 'ready' ? (
                <div className="salute-bpm-detail">
                  <div className="salute-bpm-detail__stats">
                    <span>avg {hrStats?.avg != null ? Math.round(hrStats.avg) : '—'}</span>
                    <span>min {hrStats?.min != null ? Math.round(hrStats.min) : '—'}</span>
                    <span>max {hrStats?.max != null ? Math.round(hrStats.max) : '—'}</span>
                  </div>
                  <MetricDetail
                    points={seriesFrom(recent.length ? recent : today, (r) => r?.heartRateBpm ?? r?.bpm ?? r?.heartRate)}
                    stroke="rgba(255,92,92,0.95)"
                    caption="Oggi"
                    height={120}
                    unit=" bpm"
                    domainStart={dayStartMs}
                    domainEnd={dayEndMs}
                  />
                </div>
              ) : (
                ''
              )
            }
          />
        </div>
        <div className="medical-screen__cell medical-screen__cell--sleep">
          <StatusCard
            title="Sonno"
            value={d ? fmtSleep(d.sleepMinutes) : '—'}
            detail={d?.sleepStages?.length ? <SleepStagesBar stages={d.sleepStages} /> : ''}
          />
        </div>
        <div className="medical-screen__cell medical-screen__cell--distance">
          <StatusCard
            title="Distanza"
            value={d ? fmtKm(d.distanceMeters) : '—'}
            detail=""
          />
        </div>
        <div className="medical-screen__cell medical-screen__cell--calories">
          <StatusCard
            title="Calorie"
            value={kcalToday != null ? fmt(kcalToday, ' kcal') : '—'}
            detail={
              <div className="salute-calories-detail">
                <Donut
                  value={activeKcal}
                  total={kcalToday}
                  color="#34d399"
                  label="Attive"
                />
                <div className="salute-calories-detail__meta">
                  <div>Totali {todayAgg?.caloriesKcal != null ? Math.round(todayAgg.caloriesKcal) : fmtInt(d?.calories)}</div>
                  <div>Attive {activeKcal != null ? Math.round(activeKcal) : '—'}</div>
                  {ach ? (
                    <div className="salute-ach">
                      <span className="salute-ach__ic" aria-hidden>
                        {ach.icon}
                      </span>
                      <span className="salute-ach__txt">{ach.label}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            }
          />
        </div>
        <div className="medical-screen__cell medical-screen__cell--spo2">
          <StatusCard
            title="SpO₂"
            value={todayAgg?.spo2Percent != null ? fmtPct(todayAgg.spo2Percent) : '—'}
            detail={todayAgg?.spo2Percent != null ? (Number(todayAgg.spo2Percent) >= 95 ? 'OK' : 'Bassa') : ''}
          />
        </div>
        <div className="medical-screen__cell medical-screen__cell--vo2">
          <StatusCard
            title="VO₂ max"
            value={todayAgg?.vo2Max != null ? `${Number(todayAgg.vo2Max).toFixed(0)}` : '—'}
            detail={todayAgg?.vo2Max != null ? vo2Category(todayAgg.vo2Max) : ''}
          />
        </div>
      </div>
    </div>
  )
}

