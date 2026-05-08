import {
  openMeteoCodeToUi,
  isoLocalToMinutesFromMidnight,
} from './openMeteoCodes.js'
import { getConfiguredWeatherLocationLabel } from '../config/runtime.js'

/**
 * @param {unknown} hourly
 * @param {string} dayISO YYYY-MM-DD
 * @returns {Array<{ time: string, hourLabel: string, condition: string, summary: string, temp: number | null, humidity: number | null, precipProb: number | null }>}
 */
export function buildHourlyToday(hourly, dayISO) {
  if (!hourly || typeof hourly !== 'object') return []
  const times = Array.isArray(hourly.time) ? hourly.time : null
  if (!times) return []

  const temps = Array.isArray(hourly.temperature_2m) ? hourly.temperature_2m : null
  const codes = Array.isArray(hourly.weather_code) ? hourly.weather_code : null
  const rhs = Array.isArray(hourly.relative_humidity_2m)
    ? hourly.relative_humidity_2m
    : null
  const precs = Array.isArray(hourly.precipitation_probability)
    ? hourly.precipitation_probability
    : null
  const winds = Array.isArray(hourly.wind_speed_10m) ? hourly.wind_speed_10m : null

  const out = []
  for (let i = 0; i < times.length; i += 1) {
    const t = times[i]
    if (typeof t !== 'string' || !t.startsWith(dayISO)) continue
    const d = new Date(t)
    const hourLabel = Number.isNaN(d.getTime())
      ? t.slice(11, 16)
      : d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

    const tempRaw = temps?.[i]
    const temp =
      tempRaw != null && Number.isFinite(Number(tempRaw))
        ? Math.round(Number(tempRaw))
        : null

    const probRaw = precs?.[i]
    const precipProb =
      probRaw != null && Number.isFinite(Number(probRaw))
        ? Math.max(0, Math.min(100, Math.round(Number(probRaw))))
        : null

    const rhRaw = rhs?.[i]
    const humidity =
      rhRaw != null && Number.isFinite(Number(rhRaw))
        ? Math.max(0, Math.min(100, Math.round(Number(rhRaw))))
        : null

    const code = codes?.[i]
    const wind = winds?.[i]
    const ui = openMeteoCodeToUi(
      code != null ? Number(code) : 0,
      wind != null ? Number(wind) : 0,
    )

    out.push({
      time: t,
      hourLabel,
      condition: ui.condition,
      summary: ui.summary,
      temp,
      humidity,
      precipProb,
    })
  }

  // Full day strip: 00:00 → 23:00
  return out
}

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
  const d = safeLocalDate(dateStr)
  if (Number.isNaN(d.getTime())) return index === 0 ? 'Oggi' : `Giorno ${index + 1}`

  const long = d.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return index === 0 ? `Oggi ${long}` : long
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
 * @returns {{ weather: { summary: string, highLow: string, location: string, condition: string, temperatureNow: number | null }, sunMinutes: { sunriseMinutes: number, sunsetMinutes: number } | null, sunTimes: { sunriseISO: string, sunsetISO: string } | null, hourlyToday: Array<{ time: string, hourLabel: string, condition: string, summary: string, temp: number | null, precipProb: number | null }>, forecast7: Array<{ dayLabel: string, condition: string, summary: string, min: number | null, max: number | null, humidity: number | null, time: string }> } | null}
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

  // Allerta meteo (euristica): Open-Meteo forecast non include livelli ufficiali Protezione Civile.
  // Usiamo un indicatore semplice basato su vento e probabilità di precipitazione nelle prossime 24h.
  const alert = (() => {
    if (!hourly || typeof hourly !== 'object') return null
    const times = Array.isArray(hourly.time) ? hourly.time : null
    const precs = Array.isArray(hourly.precipitation_probability)
      ? hourly.precipitation_probability
      : null
    const winds = Array.isArray(hourly.wind_speed_10m) ? hourly.wind_speed_10m : null
    const codes = Array.isArray(hourly.weather_code) ? hourly.weather_code : null
    if (!times || (!precs && !winds)) return null

    const nowMs = Date.now()
    const endMs = nowMs + 24 * 60 * 60 * 1000
    let maxProb = 0
    let maxWind = 0
    let hasStorm = false
    for (let i = 0; i < times.length; i += 1) {
      const t = times[i]
      if (typeof t !== 'string') continue
      const ms = new Date(t).getTime()
      if (!Number.isFinite(ms) || ms < nowMs || ms > endMs) continue
      const p = precs?.[i]
      const w = winds?.[i]
      const c = codes?.[i]
      const pn = p != null && Number.isFinite(Number(p)) ? Number(p) : 0
      const wn = w != null && Number.isFinite(Number(w)) ? Number(w) : 0
      if (pn > maxProb) maxProb = pn
      if (wn > maxWind) maxWind = wn
      if (c != null) {
        const { condition: cc } = openMeteoCodeToUi(Number(c), wn)
        if (cc === 'thunderstorm') hasStorm = true
      }
    }

    // Livelli: gialla / arancione / rossa.
    let level = null
    let reason = null
    if (hasStorm || maxWind >= 20 || maxProb >= 90) {
      level = 'rossa'
      reason = hasStorm ? 'Temporali' : maxWind >= 20 ? 'Vento forte' : 'Piogge intense'
    } else if (maxWind >= 15 || maxProb >= 75) {
      level = 'arancione'
      reason = maxWind >= 15 ? 'Vento sostenuto' : 'Piogge probabili'
    } else if (maxWind >= 10 || maxProb >= 60) {
      level = 'gialla'
      reason = maxWind >= 10 ? 'Raffiche' : 'Possibili piogge'
    }
    if (!level) return null
    return { level, reason }
  })()

  if (alert) weather.alert = alert

  const sr = daily.sunrise?.[0]
  const ss = daily.sunset?.[0]
  let sunMinutes = null
  let sunTimes = null
  if (sr != null && ss != null) {
    const sunriseMinutes = isoLocalToMinutesFromMidnight(String(sr))
    const sunsetMinutes = isoLocalToMinutesFromMidnight(String(ss))
    if (
      sunriseMinutes != null &&
      sunsetMinutes != null &&
      sunriseMinutes !== sunsetMinutes
    ) {
      sunMinutes = { sunriseMinutes, sunsetMinutes }
      sunTimes = { sunriseISO: String(sr), sunsetISO: String(ss) }
    }
  }

  const dayISO =
    Array.isArray(daily.time) && daily.time[0] != null
      ? String(daily.time[0])
      : new Date().toISOString().slice(0, 10)
  const hourlyToday = buildHourlyToday(hourly, dayISO)

  const forecast7 = buildForecastRowsFromDaily(daily, hourly)

  return { weather, sunMinutes, sunTimes, hourlyToday, forecast7 }
}
