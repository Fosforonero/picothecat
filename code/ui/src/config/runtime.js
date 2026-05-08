/**
 * Centralizza configurazione runtime PicoClaw.
 * In futuro: sostituire valori mock con API backend o env del dispositivo.
 */

/** Intervallo polling /health (ms) */
export const HEALTH_POLL_INTERVAL_MS = 20000

/** Inattività prima del ritorno a idle dashboard da schermate con dock (ms) */
export const IDLE_TIMEOUT_MS = 30000

/** Inattività su idle dashboard prima del deep idle / sleep UI (ms) */
export const DEEP_IDLE_TIMEOUT_MS = 120000

/** Intervallo refresh meteo Open-Meteo (ms) */
export const WEATHER_POLL_INTERVAL_MS = 600000

/** Default: Milano (configurabile con VITE_WEATHER_LAT / VITE_WEATHER_LON) */
const DEFAULT_WEATHER_LAT = 45.4642
const DEFAULT_WEATHER_LON = 9.19

/**
 * Coordinate fisse per Open-Meteo (fino a backend / GPS).
 * @returns {{ lat: number, lon: number }}
 */
export function getWeatherCoordinates() {
  const lat = Number(import.meta.env.VITE_WEATHER_LAT ?? DEFAULT_WEATHER_LAT)
  const lon = Number(import.meta.env.VITE_WEATHER_LON ?? DEFAULT_WEATHER_LON)
  return {
    lat: Number.isFinite(lat) ? lat : DEFAULT_WEATHER_LAT,
    lon: Number.isFinite(lon) ? lon : DEFAULT_WEATHER_LON,
  }
}

/**
 * Etichetta mostrata solo in **fallback coordinate configurate** (no GPS o GPS fallito).
 * Imposta `VITE_WEATHER_LABEL` (es. "Milano") per un nome reale; senza env → etichetta neutra.
 * @returns {string}
 */
export function getConfiguredWeatherLocationLabel() {
  const raw = import.meta.env.VITE_WEATHER_LABEL
  if (raw != null && String(raw).trim() !== '') return String(raw).trim()
  return 'Posizione configurata'
}

/**
 * URL opzionale (GET) inviato quando l’UI entra in idle/deep idle — es. servizio locale che abbassa il backlight.
 * @returns {string}
 */
export function getBacklightDimUrl() {
  const raw = import.meta.env.VITE_BACKLIGHT_DIM_URL
  if (raw == null || String(raw).trim() === '') return ''
  return String(raw).trim()
}

/**
 * URL opzionale (GET) quando si esce dall’idle — es. ripristino luminosità.
 * @returns {string}
 */
export function getBacklightRestoreUrl() {
  const raw = import.meta.env.VITE_BACKLIGHT_RESTORE_URL
  if (raw == null || String(raw).trim() === '') return ''
  return String(raw).trim()
}

/**
 * Base URL backend senza slash finale.
 * - stringa vuota: stessa origine (es. dev con proxy Vite su `/health`)
 * - `import.meta.env.VITE_BACKEND_BASE`: es. http://192.168.2.136:8787 in produzione
 */
export function getBackendBaseUrl() {
  const raw = import.meta.env.VITE_BACKEND_BASE
  if (raw == null || String(raw).trim() === '') {
    // Dev: usa proxy Vite su `/health` (stessa origine).
    if (import.meta.env?.DEV) return ''
    // Prod (Raspberry): UI è spesso servita staticamente su :3000 mentre il backend gira su :8787.
    // Default a loopback per evitare "failed to fetch" verso `/health` statico.
    return 'http://127.0.0.1:8787'
  }
  return String(raw).replace(/\/$/, '')
}

/**
 * Base URL per Health Sync VPS (salute).
 * @returns {string}
 */
export function getHealthSyncBaseUrl() {
  const raw = import.meta.env.VITE_HEALTHSYNC_BASE
  if (raw != null && String(raw).trim() !== '') {
    return String(raw).replace(/\/$/, '')
  }
  return 'http://51.178.43.134:3000'
}

/**
 * DeviceId Health Sync (salute). Se non impostato → mostra ultimo globale (sconsigliato con più dispositivi).
 * @returns {string}
 */
export function getHealthSyncDeviceId() {
  const raw = import.meta.env.VITE_HEALTHSYNC_DEVICE_ID
  if (raw != null && String(raw).trim() !== '') return String(raw).trim()
  return 'f41f0ac3-061e-43f4-87e8-07385de9a97a'
}

export function parseTimeToMinutes(str) {
  const parts = String(str).trim().split(':')
  const h = Number(parts[0])
  const m = Number(parts[1] ?? 0)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
  return h * 60 + m
}

/** Alba / tramonto mock (stringhe HH:mm), sovrascrivibili da .env */
export function getSunTimes() {
  return {
    sunriseMinutes: parseTimeToMinutes(
      import.meta.env.VITE_SUNRISE ?? '06:30',
    ),
    sunsetMinutes: parseTimeToMinutes(import.meta.env.VITE_SUNSET ?? '20:30'),
  }
}

export function minutesFromMidnight(date) {
  return date.getHours() * 60 + date.getMinutes()
}
