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
              onOpenForecast={openForecast}
              status={weatherStatus}
            />
            <IndoorClimateCard
              temperature={climateMock.temperature}
              mode={climateMock.mode}
            />
            <IdleHomeCard />
            <MedicalRecapCard medical={medical?.data ?? null} status={medical?.status ?? 'loading'} />
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
        status={weatherStatus}
      />
    </>
  )
}
