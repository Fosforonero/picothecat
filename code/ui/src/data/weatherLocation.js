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
  /** GeoIP (da internet) — quando il GPS non è disponibile */
  INTERNET_GEOIP: 'internet_geoip',
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
 * GeoIP da internet (no prompt). Default: ON.
 * @returns {boolean}
 */
export function shouldUseInternetGeoIp() {
  const raw = import.meta.env.VITE_WEATHER_USE_GEOIP
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
 * Coordinate da internet (GeoIP). Precisione tipica: città/quartiere grossolano.
 * Non richiede chiave.
 *
 * @returns {Promise<{ lat: number, lon: number, city?: string, region?: string, country?: string }>}
 */
export async function requestInternetGeoIpCoordinates() {
  // ipwho.is è un endpoint pubblico senza chiave, con CORS.
  // Ritorna lat/lon + città/regione.
  const res = await fetch('https://ipwho.is/')
  if (!res.ok) throw new Error(`geoip http ${res.status}`)
  const j = await res.json()
  if (!j || j.success === false) throw new Error('geoip failed')
  const lat = Number(j.latitude)
  const lon = Number(j.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('geoip invalid')
  return {
    lat,
    lon,
    city: j.city != null ? String(j.city).trim() : '',
    region: j.region != null ? String(j.region).trim() : '',
    country: j.country != null ? String(j.country).trim() : '',
  }
}

/**
 * Costruisce una label umana dalla risposta GeoIP.
 * @param {{ city?: string, region?: string, country?: string }} geo
 * @returns {string}
 */
export function formatGeoIpLabel(geo) {
  const city = geo?.city ? String(geo.city).trim() : ''
  const region = geo?.region ? String(geo.region).trim() : ''
  const country = geo?.country ? String(geo.country).trim() : ''
  if (city && region && city.toLowerCase() !== region.toLowerCase())
    return `${city}, ${region}`
  if (city) return city
  if (region) return region
  return country || 'Posizione (internet)'
}

/**
 * Forward geocoding: indirizzo → coordinate. Basato su Open‑Meteo Geocoding API.
 * @param {string} query
 * @returns {Promise<{ lat: number, lon: number, label: string } | null>}
 */
export async function geocodeAddressIt(query) {
  const q = String(query ?? '').trim()
  if (!q) return null
  const u = new URL('https://geocoding-api.open-meteo.com/v1/search')
  u.searchParams.set('name', q)
  u.searchParams.set('count', '1')
  u.searchParams.set('language', 'it')
  u.searchParams.set('format', 'json')

  const res = await fetch(u.toString())
  if (!res.ok) throw new Error(`geocode http ${res.status}`)
  const j = await res.json()
  const r = Array.isArray(j?.results) ? j.results[0] : null
  const lat = Number(r?.latitude)
  const lon = Number(r?.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

  const name = r?.name != null ? String(r.name).trim() : ''
  const admin1 = r?.admin1 != null ? String(r.admin1).trim() : ''
  const country = r?.country != null ? String(r.country).trim() : ''
  const label = [name, admin1, country].filter(Boolean).join(', ') || q
  return { lat, lon, label }
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
