import { useCallback, useState } from 'react'
import WeatherCard from './WeatherCard.jsx'
import WeatherForecastPanel from './WeatherForecastPanel.jsx'
import IndoorClimateCard from './IndoorClimateCard.jsx'
import IdleHomeCard from './IdleHomeCard.jsx'
import MedicalRecapCard from './MedicalRecapCard.jsx'
import { climateMock } from '../data/climateMock.js'

export default function IdleScreen({
  now,
  health,
  weather,
  forecast7,
  hourlyToday,
  weatherStatus,
  sunTimes,
  themeMode,
  onActivate,
  onOpenMedical,
  medical,
}) {
  const [forecastOpen, setForecastOpen] = useState(false)
  const openForecast = useCallback(() => setForecastOpen(true), [])
  const closeForecast = useCallback(() => setForecastOpen(false), [])

  const timeStr = now.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const dateStr = now.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })

  const wxLine = (() => {
    const summary = weather?.summary && weather.summary !== '—' ? weather.summary : null
    const t = weather?.temperatureNow
    if (t != null && summary) return `${t}° ${summary}`
    if (t != null) return `${t}°`
    if (summary) return summary
    return weatherStatus === 'loading'
      ? 'Meteo…'
      : weatherStatus === 'error'
        ? 'Meteo non disponibile'
        : null
  })()

  const dayPhase = (() => {
    const nowMs = now?.getTime?.()
    const sr = sunTimes?.sunriseISO ? new Date(sunTimes.sunriseISO).getTime() : NaN
    const ss = sunTimes?.sunsetISO ? new Date(sunTimes.sunsetISO).getTime() : NaN
    if (!Number.isFinite(nowMs) || !Number.isFinite(sr) || !Number.isFinite(ss))
      return themeMode === 'dark' ? 'night' : 'day'
    const dawnEnd = sr + 60 * 60 * 1000
    const duskStart = ss - 60 * 60 * 1000
    if (nowMs < sr || nowMs > ss) return 'night'
    if (nowMs >= sr && nowMs <= dawnEnd) return 'dawn'
    if (nowMs >= duskStart && nowMs <= ss) return 'dusk'
    return 'day'
  })()

  return (
    <>
      <div className="idle-screen">
        <div className="idle-screen__comfort">
          <div className="idle-hero-shell idle-hero-shell--feature">
            <span className="idle-hero__date">{dateStr}</span>
            <div className="idle-hero__clock-slot" aria-hidden>
              <span className="idle-hero__time-drift">
                <span className="idle-hero__time">{timeStr}</span>
              </span>
            </div>
            {wxLine ? <span className="idle-hero__wx">{wxLine}</span> : null}
            <button
              type="button"
              className="idle-hero-hit"
              onClick={onActivate}
              aria-label={`PicoClaw, ${timeStr}`}
            >
              <span className="visually-hidden">
                {dateStr}. {wxLine ? `${wxLine}.` : ''} {timeStr}.
              </span>
            </button>
          </div>

          <div className="idle-glances" aria-label="Informazioni ambiente">
            <WeatherCard
              weather={weather}
              themeMode={themeMode}
              phase={dayPhase}
              onOpenForecast={openForecast}
              status={weatherStatus}
            />
            <IndoorClimateCard
              temperature={climateMock.temperature}
              mode={climateMock.mode}
            />
            <IdleHomeCard />
            <MedicalRecapCard
              medical={medical?.data ?? null}
              status={medical?.status ?? 'loading'}
              lastError={
                medical?.lastError ??
                (medical?.lastUrl
                  ? `${medical.lastUrl}${medical.lastHttpStatus ? ` (HTTP ${medical.lastHttpStatus})` : ''}`
                  : null)
              }
              onClick={onOpenMedical}
            />
          </div>
        </div>

        <span className="visually-hidden" aria-live="polite">
          Stato assistente: {health.status}
        </span>
      </div>

      <WeatherForecastPanel
        open={forecastOpen}
        onClose={closeForecast}
        locationLabel={weather.location}
        rows={forecast7}
        hourlyToday={hourlyToday}
        sunTimes={sunTimes}
        alert={weather?.alert ?? null}
        status={weatherStatus}
      />
    </>
  )
}
