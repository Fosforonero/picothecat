import { useEffect, useMemo } from 'react'
import {
  getSunTimes,
  minutesFromMidnight,
} from '../config/runtime.js'

/**
 * Tema giorno/notte da alba/tramonto: preferenza dati meteo (Open-Meteo), altrimenti env/mock.
 *
 * @param {Date} now — tipicamente da useClock()
 * @param {{ sunriseMinutes: number, sunsetMinutes: number } | null} [sunFromWeather] — da useWeather quando disponibile
 * @returns {'light' | 'dark'}
 */
export function useThemeMode(now, sunFromWeather = null) {
  const fallback = useMemo(() => getSunTimes(), [])

  const { sunriseMinutes, sunsetMinutes } =
    sunFromWeather != null &&
    Number.isFinite(sunFromWeather.sunriseMinutes) &&
    Number.isFinite(sunFromWeather.sunsetMinutes)
      ? sunFromWeather
      : fallback

  const mode = useMemo(() => {
    const mins = minutesFromMidnight(now)
    const night = mins < sunriseMinutes || mins >= sunsetMinutes
    return night ? 'dark' : 'light'
  }, [now, sunriseMinutes, sunsetMinutes])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute(
        'content',
        mode === 'dark' ? '#161a22' : '#e8e0d8',
      )
    }
  }, [mode])

  return mode
}
