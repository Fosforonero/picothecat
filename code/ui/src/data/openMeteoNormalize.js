import {
  openMeteoCodeToUi,
  isoLocalToMinutesFromMidnight,
} from './openMeteoCodes.js'
import { getConfiguredWeatherLocationLabel } from '../config/runtime.js'

/**
 * @param {string} dateStr
 * @returns {Date}
 */
function safeLocalDate(dateStr) {
  if (typeof dateStr !== 'string') return new Date(NaN)
  const s = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`
  return new Date(s)
}

/**
 * @param {string} dateStr
 * @param {number} index
 */
function formatForecastDayLabel(dateStr, index) {
  if (index === 0) return 'Oggi'
  if (index === 1) return 'Domani'
  const d = safeLocalDate(dateStr)
  if (Number.isNaN(d.getTime())) return `Giorno ${index + 1}`
  return d.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/**
 * @param {unknown} daily — blocco `daily` Open-Meteo
 * @param {unknown} hourly — blocco `hourly` Open-Meteo (opzionale)
 * @returns {Array<{ dayLabel: string, condition: string, summary: string, min: number | null, max: number | null, humidity: number | null, time: string }>}
 */
export function buildForecastRowsFromDaily(daily, hourly) {
  if (!daily || typeof daily !== 'object') return []

  const times = daily.time
  const codes = daily.weather_code
  const maxs = daily.temperature_2m_max
  const mins = daily.temperature_2m_min
  if (!Array.isArray(times) || times.length === 0 || !Array.isArray(codes))
    return []

  const hTimes =
    hourly && typeof hourly === 'object' && Array.isArray(hourly.time)
      ? hourly.time
      : null
  const hRhs =
    hourly && typeof hourly === 'object' && Array.isArray(hourly.relative_humidity_2m)
      ? hourly.relative_humidity_2m
      : null

  /**
   * Umidità “giornaliera” senza endpoint daily: preferisci il valore a mezzogiorno,
   * altrimenti media dei valori della giornata.
   * @param {string} dayISO YYYY-MM-DD
   * @returns {number | null}
   */
  function humidityForDay(dayISO) {
    if (!hTimes || !hRhs) return null
    let noon = null
    let sum = 0
    let count = 0
    for (let i = 0; i < hTimes.length; i += 1) {
      const t = hTimes[i]
      if (typeof t !== 'string' || !t.startsWith(dayISO)) continue
      const raw = hRhs[i]
      const v = raw != null && Number.isFinite(Number(raw)) ? Number(raw) : null
      if (v == null) continue
      sum += v
      count += 1
      if (t.includes('T12:00')) noon = v
    }
    const picked = noon != null ? noon : count ? sum / count : null
    return picked != null ? Math.round(picked) : null
  }

  const n = Math.min(7, times.length, codes.length)
  const rows = []
  for (let i = 0; i < n; i += 1) {
    const { condition, summary } = openMeteoCodeToUi(codes[i], 0)
    const maxT = maxs?.[i]
    const minT = mins?.[i]
    const dayISO = String(times[i])
    rows.push({
      dayLabel: formatForecastDayLabel(dayISO, i),
      condition,
      summary,
      min:
        minT != null && Number.isFinite(Number(minT))
          ? Math.round(Number(minT))
          : null,
      max:
        maxT != null && Number.isFinite(Number(maxT))
          ? Math.round(Number(maxT))
          : null,
      humidity: humidityForDay(dayISO),
      time: dayISO,
    })
  }
  return rows
}

/**
 * @param {unknown} json risposta JSON forecast Open-Meteo
 * @param {{ locationLabel?: string }} [options]
 * @returns {{ weather: { summary: string, highLow: string, location: string, condition: string, temperatureNow: number | null }, sunMinutes: { sunriseMinutes: number, sunsetMinutes: number } | null, forecast7: Array<{ dayLabel: string, condition: string, summary: string, min: number | null, max: number | null, humidity: number | null, time: string }> } | null}
 */
export function normalizeOpenMeteoForecast(json, options = {}) {
  if (!json || typeof json !== 'object') return null

  const current = json.current
  const daily = json.daily
  const hourly = json.hourly
  if (!current || !daily) return null

  const code = current.weather_code
  const wind = current.wind_speed_10m
  if (!Number.isFinite(Number(code))) return null

  const { condition, summary } = openMeteoCodeToUi(code, wind)

  const tempNowRaw = current.temperature_2m
  const temperatureNow =
    tempNowRaw != null && Number.isFinite(Number(tempNowRaw))
      ? Math.round(Number(tempNowRaw))
      : null

  const maxT = daily.temperature_2m_max?.[0]
  const minT = daily.temperature_2m_min?.[0]
  const hi =
    maxT != null && Number.isFinite(Number(maxT))
      ? Math.round(Number(maxT))
      : null
  const lo =
    minT != null && Number.isFinite(Number(minT))
      ? Math.round(Number(minT))
      : null
  const highLow =
    hi != null && lo != null ? `${hi}° / ${lo}°` : '— / —'

  const locationOverride =
    options.locationLabel != null && String(options.locationLabel).trim() !== ''
      ? String(options.locationLabel).trim()
      : null

  const weather = {
    summary,
    highLow,
    location: locationOverride ?? getConfiguredWeatherLocationLabel(),
    condition,
    temperatureNow,
  }

  const sr = daily.sunrise?.[0]
  const ss = daily.sunset?.[0]
  let sunMinutes = null
  if (sr != null && ss != null) {
    const sunriseMinutes = isoLocalToMinutesFromMidnight(String(sr))
    const sunsetMinutes = isoLocalToMinutesFromMidnight(String(ss))
    if (
      sunriseMinutes != null &&
      sunsetMinutes != null &&
      sunriseMinutes !== sunsetMinutes
    ) {
      sunMinutes = { sunriseMinutes, sunsetMinutes }
    }
  }

  const forecast7 = buildForecastRowsFromDaily(daily, hourly)

  return { weather, sunMinutes, forecast7 }
}
