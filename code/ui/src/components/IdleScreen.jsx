import { useCallback, useState } from 'react'
import StatusCard from './StatusCard.jsx'
import WeatherCard from './WeatherCard.jsx'
import WeatherForecastPanel from './WeatherForecastPanel.jsx'
import IndoorClimateCard from './IndoorClimateCard.jsx'
import IdleHomeCard from './IdleHomeCard.jsx'
import { climateMock } from '../data/climateMock.js'

function assistantLine(status) {
  if (status === 'online') return 'Pronto'
  if (status === 'offline') return 'Non raggiungibile'
  return 'Connessione…'
}

function assistantDetail(status, lastError) {
  if (status === 'offline' && lastError) return lastError
  if (status === 'online') return 'Tutto regolare'
  return 'Verifica in corso'
}

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
            <StatusCard
              variant="ambient"
              personality="signal"
              title="Assistente"
              value={assistantLine(health.status)}
              detail={assistantDetail(health.status, health.lastError)}
              healthStatus={health.status}
              onClick={onActivate}
            />
          </div>
        </div>

        <span className="visually-hidden" aria-live="polite">
          Stato assistente: {assistantLine(health.status)}
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
