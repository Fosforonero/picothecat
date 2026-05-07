import { useEffect } from 'react'

/**
 * Sleep UI: solo orario (ore:minuti), canvas atmosferico; primo contatto → idle dashboard.
 * Wake: `pointerdown` (touch-first) + tasti Invio / Spazio / Esc (accessibilità).
 */
export default function DeepIdleScreen({ now, weather, weatherStatus, onWake }) {
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

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault()
        onWake()
      }
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () =>
      window.removeEventListener('keydown', onKey, { capture: true })
  }, [onWake])

  return (
    <button
      type="button"
      className="deep-idle-screen"
      onPointerDown={onWake}
      aria-label="Tocca per svegliare"
    >
      <div className="deep-idle-screen__stack" aria-hidden>
        <div className="deep-idle-screen__date">{dateStr}</div>
        <span className="deep-idle-screen__time-drift">
          <time className="deep-idle-screen__time" dateTime={now.toISOString()}>
            {timeStr}
          </time>
        </span>
        <div className="deep-idle-screen__wx">{wxLine ?? ''}</div>
      </div>
    </button>
  )
}
