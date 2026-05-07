/**
 * Geolocalizzazione browser + fallback coordinate da config (Open-Meteo).
 * Contesto sicuro (HTTPS / localhost) richiesto per il GPS.
 */

import {
  getWeatherCoordinates,
  getConfiguredWeatherLocationLabel,
} from '../config/runtime.js'

/** Origine coordinate/etichetta — utile per debug e logica esplicita */
export const WEATHER_LOCATION_SOURCE = Object.freeze({
  /** GPS + (se possibile) reverse geocoding sulla posizione live */
  LIVE_GEOLOCATION: 'live_geolocation',
  /** `VITE_WEATHER_LAT` / `LON` + `VITE_WEATHER_LABEL` o etichetta neutra */
  CONFIGURED: 'configured',
})

/**
 * @returns {boolean}
 */
export function shouldUseBrowserGeolocation() {
  const raw = import.meta.env.VITE_WEATHER_USE_GEOLOCATION
  if (raw === '0' || raw === 'false' || raw === 'off') return false
  return true
}

/**
 * @returns {boolean}
 */
export function isBrowserGeolocationUsable() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined')
    return false
  if (!navigator.geolocation) return false
  if (window.isSecureContext === true) return true
  const { protocol, hostname } = window.location
  return (
    protocol === 'https:' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  )
}

/**
 * @returns {Promise<{ lat: number, lon: number }>}
 */
export function requestBrowserCoordinates() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        })
      },
      reject,
      {
        enableHighAccuracy: false,
        maximumAge: 300000,
        timeout: 15000,
      },
    )
  })
}

/**
 * Etichetta città da coordinate live (servizio pubblico, limiti di rate).
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<string | null>}
 */
export async function reverseGeocodeLocalityIt(lat, lon) {
  // Reverse geocoding: servizio pubblico senza chiave.
  // Nota: Open-Meteo geocoding supporta solo search (forward), non reverse.
  try {
    const u = new URL(
      'https://api.bigdatacloud.net/data/reverse-geocode-client',
    )
    u.searchParams.set('latitude', String(lat))
    u.searchParams.set('longitude', String(lon))
    u.searchParams.set('localityLanguage', 'it')

    const res = await fetch(u.toString())
    if (!res.ok) return null
    const j = await res.json()

    const city = j.city != null ? String(j.city).trim() : ''
    const locality = j.locality != null ? String(j.locality).trim() : ''
    const admin = j.principalSubdivision != null ? String(j.principalSubdivision).trim() : ''
    const country = j.countryName != null ? String(j.countryName).trim() : ''

    // Preferisci quartiere/locality quando disponibile (es. "Appio-Latino") e aggiungi la città.
    if (locality && city && locality.toLowerCase() !== city.toLowerCase()) {
      return `${locality}, ${city}`
    }
    if (locality) return locality
    if (city) return city
    if (admin) return admin
    return country || null
  } catch {
    return null
  }
}

/**
 * Risolve coordinate + etichetta: **live** se GPS ok, altrimenti **solo config**.
 *
 * @returns {Promise<{
 *   lat: number,
 *   lon: number,
 *   locationLabel: string,
 *   locationSource: 'live_geolocation' | 'configured',
 *   reverseGeocodeHit: boolean,
 * }>}
 */
export async function resolveWeatherQuery() {
  const configured = getWeatherCoordinates()
  const configuredLabel = getConfiguredWeatherLocationLabel()

  const wantGeo =
    shouldUseBrowserGeolocation() && isBrowserGeolocationUsable()

  if (!wantGeo) {
    return {
      lat: configured.lat,
      lon: configured.lon,
      locationLabel: configuredLabel,
      locationSource: WEATHER_LOCATION_SOURCE.CONFIGURED,
      reverseGeocodeHit: false,
    }
  }

  try {
    const { lat, lon } = await requestBrowserCoordinates()
    let reverseGeocodeHit = false
    let locationLabel = 'Posizione attuale'
    const name = await reverseGeocodeLocalityIt(lat, lon)
    if (name) {
      locationLabel = name
      reverseGeocodeHit = true
    }
    return {
      lat,
      lon,
      locationLabel,
      locationSource: WEATHER_LOCATION_SOURCE.LIVE_GEOLOCATION,
      reverseGeocodeHit,
    }
  } catch {
    /* negato, timeout, errore → stesse API con coordinate configurate */
    return {
      lat: configured.lat,
      lon: configured.lon,
      locationLabel: configuredLabel,
      locationSource: WEATHER_LOCATION_SOURCE.CONFIGURED,
      reverseGeocodeHit: false,
    }
  }
}
