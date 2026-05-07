import { useEffect, useMemo, useState } from 'react'
import {
  getWeatherCoordinates,
  getConfiguredWeatherLocationLabel,
} from '../config/runtime.js'
import {
  isBrowserGeolocationUsable,
  requestBrowserCoordinates,
  geocodeAddressIt,
  reverseGeocodeLocalityIt,
} from '../data/weatherLocation.js'

const OVERRIDE_KEY = 'picoclaw.weather.override.v1'

function safeJsonParse(str) {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

function loadOverride() {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage?.getItem(OVERRIDE_KEY)
  if (!raw) return null
  const j = safeJsonParse(raw)
  if (!j || typeof j !== 'object') return null
  const lat = Number(j.lat)
  const lon = Number(j.lon)
  const label = j.label != null ? String(j.label).trim() : ''
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return { lat, lon, label }
}

function setOverride({ lat, lon, label }) {
  if (typeof window === 'undefined') return
  window.localStorage?.setItem(
    OVERRIDE_KEY,
    JSON.stringify({ lat, lon, label: String(label ?? '').trim() }),
  )
  window.dispatchEvent(new Event('picoclaw-weather-override-changed'))
}

function clearOverride() {
  if (typeof window === 'undefined') return
  window.localStorage?.removeItem(OVERRIDE_KEY)
  window.dispatchEvent(new Event('picoclaw-weather-override-changed'))
}

export default function WeatherLocationSettings({ weather }) {
  const configured = useMemo(() => getWeatherCoordinates(), [])
  const configuredLabel = useMemo(() => getConfiguredWeatherLocationLabel(), [])

  const [override, setOverrideState] = useState(() => loadOverride())
  const [lat, setLat] = useState(() =>
    override?.lat != null ? String(override.lat) : String(configured.lat),
  )
  const [lon, setLon] = useState(() =>
    override?.lon != null ? String(override.lon) : String(configured.lon),
  )
  const [label, setLabel] = useState(() =>
    override?.label ? override.label : configuredLabel,
  )
  const [address, setAddress] = useState('')
  const [msg, setMsg] = useState('')
  const [gpsStatus, setGpsStatus] = useState('idle') // 'idle' | 'loading' | 'error'
  const [addrStatus, setAddrStatus] = useState('idle') // 'idle' | 'loading' | 'error'

  useEffect(() => {
    const onStorage = () => setOverrideState(loadOverride())
    window.addEventListener('storage', onStorage)
    window.addEventListener('picoclaw-weather-override-changed', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('picoclaw-weather-override-changed', onStorage)
    }
  }, [])

  const activeLabel = weather?.location ?? ''

  const onSearchAddress = async () => {
    setMsg('')
    const q = String(address ?? '').trim()
    if (!q) {
      setAddrStatus('error')
      setMsg('Inserisci un indirizzo.')
      window.setTimeout(() => setAddrStatus('idle'), 1500)
      return
    }

    setAddrStatus('loading')
    try {
      const hit = await geocodeAddressIt(q)
      if (!hit) {
        setAddrStatus('error')
        setMsg('Indirizzo non trovato.')
        window.setTimeout(() => setAddrStatus('idle'), 2000)
        return
      }
      setLat(String(hit.lat))
      setLon(String(hit.lon))
      setLabel(hit.label)
      setMsg('Indirizzo risolto. Premi “Salva” per applicarlo come override.')
      window.setTimeout(() => setMsg(''), 3500)
      setAddrStatus('idle')
    } catch (e) {
      setAddrStatus('error')
      setMsg(e?.message ? `Errore ricerca indirizzo (${e.message}).` : 'Errore ricerca indirizzo.')
      window.setTimeout(() => {
        setAddrStatus('idle')
        setMsg('')
      }, 3000)
    }
  }

  const onUseGps = async () => {
    setMsg('')
    if (!isBrowserGeolocationUsable()) {
      setGpsStatus('error')
      setMsg(
        'GPS non disponibile in questo contesto. Apri l’UI su https o su http://localhost.',
      )
      window.setTimeout(() => setGpsStatus('idle'), 2000)
      return
    }

    setGpsStatus('loading')
    try {
      const { lat: latN, lon: lonN } = await requestBrowserCoordinates()
      setLat(String(latN))
      setLon(String(lonN))

      const name = await reverseGeocodeLocalityIt(latN, lonN)
      if (name && String(name).trim() !== '') {
        setLabel(String(name).trim())
      }

      setMsg('Posizione aggiornata. Premi “Salva” per applicarla come override.')
      window.setTimeout(() => setMsg(''), 3500)
      setGpsStatus('idle')
    } catch (e) {
      setGpsStatus('error')
      const message =
        e?.code === 1
          ? 'Permesso GPS negato.'
          : e?.message
            ? `GPS non disponibile (${e.message}).`
            : 'GPS non disponibile.'
      setMsg(message)
      window.setTimeout(() => {
        setGpsStatus('idle')
        setMsg('')
      }, 3000)
    }
  }

  const onSave = () => {
    const latN = Number(lat)
    const lonN = Number(lon)
    if (!Number.isFinite(latN) || !Number.isFinite(lonN)) {
      setMsg('Coordinate non valide.')
      return
    }
    setOverride({ lat: latN, lon: lonN, label })
    setMsg('Salvato. Aggiornamento meteo in corso…')
    window.setTimeout(() => setMsg(''), 2500)
  }

  const onReset = () => {
    clearOverride()
    setLat(String(configured.lat))
    setLon(String(configured.lon))
    setLabel(configuredLabel)
    setMsg('Reset effettuato.')
    window.setTimeout(() => setMsg(''), 2000)
  }

  return (
    <section className="settings-panel" aria-label="Impostazioni meteo">
      <h1 className="settings-title">Impostazioni</h1>
      <p className="settings-subtitle">
        Posizione meteo. Se la geolocalizzazione browser non è disponibile, puoi
        impostare qui una posizione “manuale”.
      </p>

      <div className="settings-card">
        <div className="settings-card__head">
          <h2 className="settings-card__title">Posizione meteo</h2>
          <p className="settings-card__meta">
            Attuale: <span className="settings-mono">{activeLabel || '—'}</span>
          </p>
        </div>

        <div className="settings-grid">
          <label className="settings-field settings-field--wide">
            <span className="settings-field__label">Indirizzo</span>
            <input
              className="settings-field__input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Es. Via Collazia 20, 00183 Roma"
              aria-label="Indirizzo"
            />
          </label>
          <label className="settings-field">
            <span className="settings-field__label">Latitudine</span>
            <input
              className="settings-field__input"
              inputMode="decimal"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              aria-label="Latitudine"
            />
          </label>
          <label className="settings-field">
            <span className="settings-field__label">Longitudine</span>
            <input
              className="settings-field__input"
              inputMode="decimal"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              aria-label="Longitudine"
            />
          </label>
          <label className="settings-field settings-field--wide">
            <span className="settings-field__label">Etichetta</span>
            <input
              className="settings-field__input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              aria-label="Etichetta posizione"
            />
          </label>
        </div>

        <div className="settings-actions">
          <button
            type="button"
            className="settings-btn settings-btn--ghost"
            onClick={onSearchAddress}
            disabled={addrStatus === 'loading'}
          >
            {addrStatus === 'loading' ? 'Cerca…' : 'Cerca indirizzo'}
          </button>
          <button
            type="button"
            className="settings-btn settings-btn--ghost"
            onClick={onUseGps}
            disabled={gpsStatus === 'loading'}
          >
            {gpsStatus === 'loading' ? 'GPS…' : 'Usa posizione attuale (GPS)'}
          </button>
          <button type="button" className="settings-btn" onClick={onSave}>
            Salva
          </button>
          <button
            type="button"
            className="settings-btn settings-btn--ghost"
            onClick={onReset}
          >
            Reset
          </button>
          <span className="settings-hint">
            Override:{' '}
            <span className="settings-mono">
              {override ? 'attivo' : 'non attivo'}
            </span>
          </span>
        </div>

        {msg ? <p className="settings-msg">{msg}</p> : null}
      </div>
    </section>
  )
}

