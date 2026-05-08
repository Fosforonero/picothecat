import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import WeatherGlyph from './weather/WeatherGlyph.jsx'
import HumidityDrop from './weather/HumidityDrop.jsx'

function clamp01(x) {
  if (!Number.isFinite(x)) return 0
  if (x < 0) return 0
  if (x > 1) return 1
  return x
}

/**
 * Pannello previsioni 7 giorni (portal su body: fuori dal filtro comfort idle).
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   locationLabel: string,
 *   rows: Array<{ dayLabel: string, summary: string, condition: string, min: number | null, max: number | null, humidity?: number | null }>,
 *   hourlyToday?: Array<{ time: string, hourLabel: string, condition: string, summary: string, temp: number | null, humidity: number | null, precipProb: number | null }>,
 *   sunTimes?: { sunriseISO: string, sunsetISO: string } | null,
 *   alert?: { level: 'gialla' | 'arancione' | 'rossa', reason?: string } | null,
 *   status?: 'loading' | 'ready' | 'error',
 * }} props
 */
export default function WeatherForecastPanel({
  open,
  onClose,
  locationLabel,
  rows,
  hourlyToday = [],
  sunTimes = null,
  alert = null,
  status = 'ready',
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const validMins = rows
    .map((r) => (r.min != null ? Number(r.min) : NaN))
    .filter((v) => Number.isFinite(v))
  const validMaxs = rows
    .map((r) => (r.max != null ? Number(r.max) : NaN))
    .filter((v) => Number.isFinite(v))
  const weekMin = validMins.length ? Math.min(...validMins) : null
  const weekMax = validMaxs.length ? Math.max(...validMaxs) : null
  const span =
    weekMin != null && weekMax != null ? Math.max(1, weekMax - weekMin) : 1

  const fmtSun = (iso) => {
    if (!iso) return ''
    const d = new Date(String(iso))
    if (Number.isNaN(d.getTime())) return String(iso).slice(11, 16)
    return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  }
  const sunrise = sunTimes?.sunriseISO ? fmtSun(sunTimes.sunriseISO) : ''
  const sunset = sunTimes?.sunsetISO ? fmtSun(sunTimes.sunsetISO) : ''
  const showToday =
    typeof rows?.[0]?.dayLabel === 'string' &&
    rows[0].dayLabel.startsWith('Oggi') &&
    (hourlyToday?.length || sunrise || sunset)
  const weekRows = showToday ? rows.slice(1) : rows

  const body = (
    <div
      className="weather-forecast-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="weather-forecast-title"
    >
      <button
        type="button"
        className="weather-forecast-backdrop"
        onClick={onClose}
        aria-label="Chiudi previsioni"
      />
      <div className="weather-forecast-sheet">
        <div className="weather-forecast-sheet__head">
          <h2 id="weather-forecast-title" className="weather-forecast-sheet__title">
            Previsioni
          </h2>
          <p className="weather-forecast-sheet__sub">{locationLabel}</p>
          <button
            type="button"
            className="weather-forecast-sheet__close"
            onClick={onClose}
            aria-label="Chiudi"
          >
            Chiudi
          </button>
        </div>

        {showToday ? (
          <section className="weather-forecast-today" aria-label="Oggi">
            <article className="weather-forecast-todaycard">
              <div className="weather-forecast-todaycard__head">
                <h3 className="weather-forecast-todaycard__title">
                  {rows?.[0]?.dayLabel ?? 'Oggi'}
                </h3>
                <div className="weather-forecast-todaycard__meta">
                  {alert?.level ? (
                    <span className={`wx-alert wx-alert--${alert.level}`}>
                      Allerta {alert.level}
                      {alert.reason ? ` · ${alert.reason}` : ''}
                    </span>
                  ) : null}
                  {sunrise ? <span>Alba {sunrise}</span> : null}
                  {sunset ? <span>Tramonto {sunset}</span> : null}
                </div>
              </div>

              <div className="weather-forecast-todaycard__strip" role="list" aria-label="Oggi: previsioni orarie">
                {hourlyToday.map((h) => (
                  <div
                    key={h.time}
                    className={`weather-forecast-hour weather-forecast-hour--${h.condition}`}
                    role="listitem"
                  >
                    <div className="weather-forecast-hour__t">{h.hourLabel}</div>
                    <div className="weather-forecast-hour__icon" aria-hidden>
                      <WeatherGlyph variant={h.condition} />
                    </div>
                    <div className="weather-forecast-hour__temp">
                      {h.temp != null ? `${h.temp}°` : '—'}
                    </div>
                    <div className="weather-forecast-hour__sub">
                      <span className="weather-forecast-hour__hum">
                        {h.humidity != null ? `${h.humidity}%` : ' '}
                      </span>
                      <span className="weather-forecast-hour__prob">
                        {h.precipProb != null ? `${h.precipProb}%` : ' '}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        ) : null}

        <section className="weather-forecast-week" aria-label="Previsioni 7 giorni">
          {weekRows.length === 0 ? (
            <p className="weather-forecast-week__empty">
              {status === 'loading'
                ? 'Caricamento previsioni…'
                : status === 'error'
                  ? 'Meteo non disponibile (verifica rete / permessi).'
                  : 'Dati previsione non disponibili.'}
            </p>
          ) : (
            <div className="weather-forecast-vlist" role="list">
              {weekRows.map((row, idx) => {
                const min = row.min != null ? Number(row.min) : null
                const max = row.max != null ? Number(row.max) : null
                const humidity =
                  row.humidity != null && Number.isFinite(Number(row.humidity))
                    ? Math.round(Number(row.humidity))
                    : null
                const hasRange =
                  min != null &&
                  max != null &&
                  Number.isFinite(min) &&
                  Number.isFinite(max)
                const start =
                  hasRange && weekMin != null ? clamp01((min - weekMin) / span) : 0
                const width =
                  hasRange && weekMin != null ? clamp01((max - min) / span) : 0

                return (
                  <article
                    key={row.time ? `${row.time}-${idx}` : `f-${idx}`}
                    className={`weather-forecast-rowcard weather-forecast-rowcard--${row.condition}`}
                    role="listitem"
                  >
                    <div className="weather-forecast-rowcard__left">
                      <p className="weather-forecast-rowcard__day">{row.dayLabel}</p>
                      <div className="weather-forecast-rowcard__icon" aria-hidden>
                        <WeatherGlyph variant={row.condition} />
                      </div>
                    </div>
                    <div className="weather-forecast-rowcard__mid">
                      <p className="weather-forecast-rowcard__cond">{row.summary}</p>
                      <p className="weather-forecast-rowcard__meta">
                        {humidity != null ? (
                          <>
                            <HumidityDrop className="weather-forecast-rowcard__drop" />{' '}
                            <span className="weather-forecast-rowcard__humidity">
                              {humidity}%
                            </span>
                          </>
                        ) : (
                          ' '
                        )}
                      </p>
                    </div>
                    <div className="weather-forecast-rowcard__temps">
                      <span className="weather-forecast-rowcard__min">
                        {min != null && Number.isFinite(min) ? `${Math.round(min)}°` : '—'}
                      </span>
                      <div
                        className="weather-forecast-rowcard__range"
                        aria-hidden
                        style={{
                          '--start': String(start),
                          '--span': String(width),
                        }}
                      />
                      <span className="weather-forecast-rowcard__max">
                        {max != null && Number.isFinite(max) ? `${Math.round(max)}°` : '—'}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )

  return createPortal(body, document.body)
}
