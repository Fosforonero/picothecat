/**
 * Mappa WMO weathercode (Open-Meteo) → chiavi UI PicoClaw.
 * Riferimento: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
 *
 * Condizioni UI: sunny | cloudy | rainy | thunderstorm | snow | windy | mist
 * (clear_night è derivata in getWeatherVisualKey da sunny/clear + tema scuro.)
 */

/**
 * @param {number} code
 * @param {number} [windKmh] wind_speed_10m in km/h (default Open-Meteo)
 * @returns {{ condition: string, summary: string }}
 */
export function openMeteoCodeToUi(code, windKmh = 0) {
  const c = Number(code)
  const w = Number(windKmh) || 0

  // Vento forte su cielo altrimenti calmo / poco perturbato
  if (w >= 55 && [0, 1, 2, 3].includes(c)) {
    return { condition: 'windy', summary: 'Vento forte' }
  }

  if (c === 0) return { condition: 'sunny', summary: 'Sereno' }
  if (c === 1) return { condition: 'sunny', summary: 'Quasi sereno' }
  if (c === 2) return { condition: 'cloudy', summary: 'Parzialmente nuvoloso' }
  if (c === 3) return { condition: 'cloudy', summary: 'Coperto' }

  if (c === 45 || c === 48) return { condition: 'mist', summary: 'Nebbia' }

  if (c >= 51 && c <= 57)
    return { condition: 'rainy', summary: 'Pioggerella' }

  if (c >= 61 && c <= 67)
    return { condition: 'rainy', summary: 'Pioggia' }

  if (c >= 71 && c <= 77)
    return { condition: 'snow', summary: 'Neve' }

  if (c >= 80 && c <= 82)
    return { condition: 'rainy', summary: 'Rovesci' }

  if (c >= 85 && c <= 86)
    return { condition: 'snow', summary: 'Rovesci di neve' }

  if (c >= 95 && c <= 99)
    return { condition: 'thunderstorm', summary: 'Temporale' }

  return { condition: 'cloudy', summary: 'Variabile' }
}

/**
 * @param {string} iso
 * @returns {number | null} minuti dalla mezzanotte (orologio locale del browser)
 */
export function isoLocalToMinutesFromMidnight(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.getHours() * 60 + d.getMinutes()
}
