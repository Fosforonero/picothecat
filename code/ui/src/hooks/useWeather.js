import { useEffect, useState } from 'react'
import { weatherMock } from '../data/weatherMock.js'
import { normalizeOpenMeteoForecast } from '../data/openMeteoNormalize.js'
import {
  getWeatherCoordinates,
  getConfiguredWeatherLocationLabel,
  WEATHER_POLL_INTERVAL_MS,
} from '../config/runtime.js'
import {
  WEATHER_LOCATION_SOURCE,
  shouldUseBrowserGeolocation,
  requestBrowserCoordinates,
  requestInternetGeoIpCoordinates,
  formatGeoIpLabel,
  reverseGeocodeLocalityIt,
} from '../data/weatherLocation.js'

const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast'
const WEATHER_CACHE_KEY = 'picoclaw.weather.v1'
const CONFIGURED_LABEL_CACHE_KEY = 'picoclaw.weather.configuredLabel.v1'
const OVERRIDE_KEY = 'picoclaw.weather.override.v1'

function emptyWeather(location) {
  return {
    ...weatherMock,
    location,
    summary: '—',
    highLow: '—',
    temperatureNow: null,
  }
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

function loadCache() {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage?.getItem(WEATHER_CACHE_KEY)
  if (!raw) return null
  const parsed = safeJsonParse(raw)
  if (!parsed || typeof parsed !== 'object') return null
  return parsed
}

function saveCache(payload) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage?.setItem(WEATHER_CACHE_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota / private mode
  }
}

function loadOverride() {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage?.getItem(OVERRIDE_KEY)
  if (!raw) return null
  const parsed = safeJsonParse(raw)
  if (!parsed || typeof parsed !== 'object') return null
  const lat = Number(parsed.lat)
  const lon = Number(parsed.lon)
  const label =
    parsed.label != null && String(parsed.label).trim() !== ''
      ? String(parsed.label).trim()
      : ''
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return { lat, lon, label }
}

/**
 * Meteo Open-Meteo: posizione live (GPS) o configurata; etichetta coerente con `locationSource`.
 * @returns {{
 *   weather: typeof weatherMock,
 *   sunMinutes: { sunriseMinutes: number, sunsetMinutes: number } | null,
 *   forecast7: Array<{ dayLabel: string, condition: string, summary: string, min: number | null, max: number | null, time: string }>,
 *   locationSource: 'live_geolocation' | 'configured',
 *   reverseGeocodeHit: boolean,
 * }}
 */
export function useWeather() {
  const [weather, setWeather] = useState(() => {
    const cached = loadCache()
    if (cached?.weather) return cached.weather
    return emptyWeather(getConfiguredWeatherLocationLabel())
  })
  const [sunMinutes, setSunMinutes] = useState(() => {
    const cached = loadCache()
    return cached?.sunMinutes ?? null
  })
  const [forecast7, setForecast7] = useState(() => {
    const cached = loadCache()
    return Array.isArray(cached?.forecast7) ? cached.forecast7 : []
  })
  const [locationSource, setLocationSource] = useState(
    WEATHER_LOCATION_SOURCE.CONFIGURED,
  )
  const [reverseGeocodeHit, setReverseGeocodeHit] = useState(false)
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'

  useEffect(() => {
    let cancelled = false
    let configuredLabelPromise = null
    const devLog = (...args) => {
      if (import.meta.env?.DEV) {
        // eslint-disable-next-line no-console
        console.info('[weather]', ...args)
      }
    }

    async function resolveConfiguredLabelOnce(cfg) {
      if (typeof window === 'undefined') return null
      const cached = window.localStorage?.getItem(CONFIGURED_LABEL_CACHE_KEY)
      if (cached && String(cached).trim() !== '') return String(cached).trim()

      const fallback = getConfiguredWeatherLocationLabel()
      // Se l'utente ha impostato una label esplicita, non la sovrascriviamo.
      if (fallback && fallback !== 'Posizione configurata') return fallback

      try {
        const name = await reverseGeocodeLocalityIt(cfg.lat, cfg.lon)
        if (name && String(name).trim() !== '') {
          window.localStorage?.setItem(
            CONFIGURED_LABEL_CACHE_KEY,
            String(name).trim(),
          )
          return String(name).trim()
        }
      } catch {
        // ignore
      }
      return fallback
    }

    async function fetchForecast({ lat, lon, locationLabel, source, revHit }) {
      const url = new URL(OPEN_METEO_FORECAST)
      url.searchParams.set('latitude', String(lat))
      url.searchParams.set('longitude', String(lon))
      url.searchParams.set(
        'current',
        'temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m',
      )
      url.searchParams.set(
        'daily',
        'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
      )
      url.searchParams.set('hourly', 'relative_humidity_2m')
      url.searchParams.set('timezone', 'auto')

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`http ${res.status}`)
      const json = await res.json()
      const normalized = normalizeOpenMeteoForecast(json, {
        locationLabel,
      })
      if (!normalized) throw new Error('normalize')

      if (cancelled) return
      setLocationSource(source)
      setReverseGeocodeHit(Boolean(revHit))
      setWeather(normalized.weather)
      setSunMinutes(normalized.sunMinutes)
      setForecast7(normalized.forecast7 ?? [])
      setStatus('ready')
      saveCache({
        ts: Date.now(),
        weather: normalized.weather,
        sunMinutes: normalized.sunMinutes,
        forecast7: normalized.forecast7 ?? [],
      })
    }

    async function tryBrowserGeolocationAndFetch() {
      if (!shouldUseBrowserGeolocation()) return false
      // Fonte primaria: navigator.geolocation.
      // Nota: su origin non sicuri (es. http://192.168.x.x) molti browser rifiutano comunque la richiesta:
      // in quel caso la Promise va in errore e passiamo al fallback configurato.
      if (typeof navigator === 'undefined' || !navigator.geolocation) return false

      devLog('trying browser geolocation', {
        origin: typeof window !== 'undefined' ? window.location.origin : 'n/a',
        secureContext: typeof window !== 'undefined' ? window.isSecureContext : 'n/a',
      })

      try {
        const timeoutMs = 6500
        const { lat, lon } = await Promise.race([
          requestBrowserCoordinates(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('geo timeout')), timeoutMs),
          ),
        ])

        const name = await reverseGeocodeLocalityIt(lat, lon)
        await fetchForecast({
          lat,
          lon,
          locationLabel: name || 'Posizione attuale',
          source: WEATHER_LOCATION_SOURCE.LIVE_GEOLOCATION,
          revHit: Boolean(name),
        })
        return true
      } catch (e) {
        devLog('browser geolocation failed → fallback', {
          name: e?.name,
          message: e?.message,
        })
        return false
      }
    }

    async function tryInternetGeoIpAndFetch() {
      if (!shouldUseBrowserGeolocation()) return false
      devLog('trying internet geoip')
      try {
        const geo = await Promise.race([
          requestInternetGeoIpCoordinates(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('geoip timeout')), 4500),
          ),
        ])

        // Label: prima da GeoIP (città/regione), poi se possibile la rendiamo più “locale” via reverse geocode.
        let locationLabel = formatGeoIpLabel(geo)
        try {
          const name = await reverseGeocodeLocalityIt(geo.lat, geo.lon)
          if (name) locationLabel = name
        } catch {
          // ignore
        }

        await fetchForecast({
          lat: geo.lat,
          lon: geo.lon,
          locationLabel,
          source: WEATHER_LOCATION_SOURCE.INTERNET_GEOIP,
          revHit: false,
        })
        return true
      } catch (e) {
        devLog('internet geoip failed → fallback', {
          name: e?.name,
          message: e?.message,
        })
        return false
      }
    }

    async function tick() {
      if (!cancelled) setStatus((s) => (s === 'ready' ? 'ready' : 'loading'))

      // 1) Primario: prova subito geolocation browser (se abilitata).
      // Se fallisce o è negata/indisponibile, fallback a coordinate configurate.
      const geoOk = await tryBrowserGeolocationAndFetch()
      if (geoOk) return

      // 1b) Se non abbiamo GPS, prova a stimare la posizione da Internet (GeoIP).
      const geoIpOk = await tryInternetGeoIpAndFetch()
      if (geoIpOk) return

      // 2) Fallback preferito: override manuale salvato localmente (per dispositivi senza GPS).
      const ov = loadOverride()
      if (ov) {
        try {
          await fetchForecast({
            lat: ov.lat,
            lon: ov.lon,
            locationLabel:
              ov.label && ov.label !== '' ? ov.label : 'Posizione manuale',
            source: WEATHER_LOCATION_SOURCE.CONFIGURED,
            revHit: false,
          })
          return
        } catch {
          // se fallisce, proseguiamo sul fallback configurato
        }
      }

      // 3) Fallback: fetch su coordinate configurate.
      const cfg = getWeatherCoordinates()
      const cfgLabelRaw = getConfiguredWeatherLocationLabel()
      if (!configuredLabelPromise) {
        configuredLabelPromise = resolveConfiguredLabelOnce(cfg)
      }
      const cfgLabel =
        (await configuredLabelPromise) || cfgLabelRaw || 'Posizione configurata'
      try {
        await fetchForecast({
          lat: cfg.lat,
          lon: cfg.lon,
          locationLabel: cfgLabel,
          source: WEATHER_LOCATION_SOURCE.CONFIGURED,
          revHit: false,
        })
      } catch {
        if (!cancelled) {
          setWeather((prev) => (prev && prev.summary !== '—' ? prev : emptyWeather(cfgLabel)))
          setSunMinutes(null)
          setForecast7((prev) => (prev && prev.length ? prev : []))
          setStatus('error')
        }
      }
    }

    const t0 = setTimeout(() => {
      void tick()
    }, 0)
    const id = setInterval(() => {
      void tick()
    }, WEATHER_POLL_INTERVAL_MS)

    const onOverrideChanged = () => {
      void tick()
    }
    window.addEventListener('picoclaw-weather-override-changed', onOverrideChanged)

    return () => {
      cancelled = true
      clearTimeout(t0)
      clearInterval(id)
      window.removeEventListener('picoclaw-weather-override-changed', onOverrideChanged)
    }
  }, [])

  return {
    weather,
    sunMinutes,
    forecast7,
    locationSource,
    reverseGeocodeHit,
    status,
  }
}
