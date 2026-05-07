import { getWeatherVisualKey } from '../data/weatherMock.js'
import WeatherGlyph from './weather/WeatherGlyph.jsx'

/**
 * Card meteo: sfondo + glifo grande integrato nell’atmosfera.
 * Con `onOpenForecast` diventa un bottone (tap → previsioni).
 */
export default function WeatherCard({
  weather,
  themeMode,
  onOpenForecast,
  status = 'ready',
}) {
  const skin = getWeatherVisualKey(weather, themeMode)
  const interactive = typeof onOpenForecast === 'function'
  const Tag = interactive ? 'button' : 'article'
  const tapProps = interactive
    ? {
        type: 'button',
        onClick: onOpenForecast,
      }
    : {}

  return (
    <Tag
      className={`weather-card weather-card--${skin}${interactive ? ' weather-card--interactive' : ''}`}
      aria-label={
        interactive
          ? `Meteo: ${weather.summary}. Apri previsioni sette giorni`
          : `Meteo: ${weather.summary}`
      }
      {...tapProps}
    >
      <div className="weather-card__atmosphere" aria-hidden />
      <div className="weather-card__glyph-overlay" aria-hidden />
      <div className="weather-card__glyph-layer" aria-hidden>
        <WeatherGlyph variant={skin} />
      </div>
      <div className="weather-card__body">
        <div className="weather-card__upper">
          <div className="weather-card__label">Meteo</div>
          {status !== 'ready' ? (
            <div className="weather-card__status" aria-hidden>
              {status === 'loading' ? '…' : 'offline'}
            </div>
          ) : null}
        </div>
        <div className="weather-card__lower">
          <div className="weather-card__summary">
            {weather.temperatureNow != null ? (
              <span className="weather-card__temp" aria-hidden>
                {weather.temperatureNow}°
              </span>
            ) : null}
            <span className="weather-card__summary-text">{weather.summary}</span>
          </div>
          <div className="weather-card__meta">
            {weather.highLow} ·{' '}
            {String(weather.location || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 2)
              .join(', ')}
          </div>
        </div>
      </div>
    </Tag>
  )
}
