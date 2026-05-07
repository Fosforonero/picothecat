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
const PLACES_KEY = 'picoclaw.weather.places.v1'

const NAME_SUGGESTIONS = [
  'Casa',
  'Ufficio',
  'Casa Papà',
  'Casa Mamma',
  'Casa Zia',
  'Casa Nonna',
  'Casa Nonno',
]

const PRESET_ADDRESSES = [
  {
    id: 'home',
    label: 'Casa',
    address: 'Via Collazia 20, 00183 Roma RM',
    defaultName: 'Casa',
  },
  {
    id: 'office',
    label: 'Ufficio',
    address: 'Via Giuseppe Gioachino Belli 28, 00193 Roma RM',
    defaultName: 'Ufficio',
  },
]

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

function loadPlaces() {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage?.getItem(PLACES_KEY)
  if (!raw) return []
  const j = safeJsonParse(raw)
  if (!Array.isArray(j)) return []
  return j
    .map((p) => {
      if (!p || typeof p !== 'object') return null
      const id = p.id != null ? String(p.id) : ''
      const name = p.name != null ? String(p.name).trim() : ''
      const address = p.address != null ? String(p.address).trim() : ''
      const label = p.label != null ? String(p.label).trim() : ''
      const lat = Number(p.lat)
      const lon = Number(p.lon)
      if (!id || !name || !Number.isFinite(lat) || !Number.isFinite(lon))
        return null
      return { id, name, address, label, lat, lon }
    })
    .filter(Boolean)
}

function savePlaces(list) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage?.setItem(PLACES_KEY, JSON.stringify(list))
  } catch {
    // ignore quota/private mode
  }
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
  const [placeName, setPlaceName] = useState('Casa')
  const [places, setPlaces] = useState(() => loadPlaces())
  const [msg, setMsg] = useState('')
  const [gpsStatus, setGpsStatus] = useState('idle') // 'idle' | 'loading' | 'error'
  const [addrStatus, setAddrStatus] = useState('idle') // 'idle' | 'loading' | 'error'

  useEffect(() => {
    const onStorage = () => {
      setOverrideState(loadOverride())
      setPlaces(loadPlaces())
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('picoclaw-weather-override-changed', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('picoclaw-weather-override-changed', onStorage)
    }
  }, [])

  const activeLabel = weather?.location ?? ''

  const runAddressSearch = async (q) => {
    setMsg('')
    const query = String(q ?? '').trim()
    if (!query) {
      setAddrStatus('error')
      setMsg('Inserisci un indirizzo.')
      window.setTimeout(() => setAddrStatus('idle'), 1500)
      return null
    }

    setAddrStatus('loading')
    try {
      const hit = await geocodeAddressIt(query)
      if (!hit) {
        setAddrStatus('error')
        setMsg('Indirizzo non trovato.')
        window.setTimeout(() => setAddrStatus('idle'), 2000)
        return null
      }
      setLat(String(hit.lat))
      setLon(String(hit.lon))
      setLabel(hit.label)
      setMsg(
        'Indirizzo risolto. Premi “Salva” per applicarlo come override o “Salva in elenco”.',
      )
      window.setTimeout(() => setMsg(''), 3500)
      setAddrStatus('idle')
      return hit
    } catch (e) {
      setAddrStatus('error')
      setMsg(
        e?.message
          ? `Errore ricerca indirizzo (${e.message}).`
          : 'Errore ricerca indirizzo.',
      )
      window.setTimeout(() => {
        setAddrStatus('idle')
        setMsg('')
      }, 3000)
      return null
    }
  }

  const onApplyPlace = (p) => {
    setLat(String(p.lat))
    setLon(String(p.lon))
    setLabel(p.label || p.name)
    setAddress(p.address || '')
    setMsg(`Selezionato: ${p.name}. Premi “Salva” per applicarlo come override.`)
    window.setTimeout(() => setMsg(''), 3000)
  }

  const onApplyPlaceNow = (p) => {
    setLat(String(p.lat))
    setLon(String(p.lon))
    setLabel(p.label || p.name)
    setAddress(p.address || '')
    setOverride({ lat: p.lat, lon: p.lon, label: p.label || p.name })
    setMsg(`Applicato: ${p.name}. Aggiornamento meteo in corso…`)
    window.setTimeout(() => setMsg(''), 2500)
  }

  const onDeletePlace = (id) => {
    const next = places.filter((p) => p.id !== id)
    setPlaces(next)
    savePlaces(next)
    setMsg('Posizione rimossa.')
    window.setTimeout(() => setMsg(''), 2000)
  }

  const onSaveAsPlace = () => {
    setMsg('')
    const name = String(placeName ?? '').trim()
    const latN = Number(lat)
    const lonN = Number(lon)
    if (!name) {
      setMsg('Inserisci un nome per la posizione.')
      return
    }
    if (!Number.isFinite(latN) || !Number.isFinite(lonN)) {
      setMsg('Coordinate non valide.')
      return
    }

    const id = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
    const entry = {
      id,
      name,
      address: String(address ?? '').trim(),
      label: String(label ?? '').trim() || name,
      lat: latN,
      lon: lonN,
    }
    const next = [entry, ...places]
    setPlaces(next)
    savePlaces(next)
    setMsg('Salvato in elenco posizioni.')
    window.setTimeout(() => setMsg(''), 2000)
  }

  const onSearchAddress = async () => {
    await runAddressSearch(address)
  }

  const onUsePreset = async (preset) => {
    const a = preset?.address ?? ''
    setAddress(a)
    if (preset?.defaultName) setPlaceName(preset.defaultName)
    const hit = await runAddressSearch(a)
    if (hit) {
      // Per i preset Casa/Ufficio l'intento è “imposta subito”.
      setOverride({ lat: hit.lat, lon: hit.lon, label: hit.label || preset?.label })
      setMsg(`Applicato: ${preset?.label || 'preset'}. Aggiornamento meteo in corso…`)
      window.setTimeout(() => setMsg(''), 2500)
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

        {places.length ? (
          <div className="settings-places" aria-label="Posizioni salvate">
            <div className="settings-places__head">
              <h3 className="settings-places__title">Posizioni salvate</h3>
              <p className="settings-places__hint">Tocca per selezionare o applicare.</p>
            </div>
            <div className="settings-places__list">
              {places.map((p) => (
                <div key={p.id} className="settings-place">
                  <button
                    type="button"
                    className="settings-place__main"
                    onClick={() => onApplyPlace(p)}
                  >
                    <span className="settings-place__name">{p.name}</span>
                    <span className="settings-place__meta">
                      {(p.label || '').trim() || '—'}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="settings-place__btn"
                    onClick={() => onApplyPlaceNow(p)}
                    aria-label={`Applica ${p.name}`}
                  >
                    Usa
                  </button>
                  <button
                    type="button"
                    className="settings-place__btn settings-place__btn--danger"
                    onClick={() => onDeletePlace(p.id)}
                    aria-label={`Rimuovi ${p.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

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
          <label className="settings-field settings-field--wide settings-field--inline">
            <span className="settings-field__label">Salva in elenco come</span>
            <input
              className="settings-field__input"
              list="place-name-suggestions"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              aria-label="Nome posizione"
            />
            <datalist id="place-name-suggestions">
              {NAME_SUGGESTIONS.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </label>
          {PRESET_ADDRESSES.map((p) => (
            <button
              key={p.id}
              type="button"
              className="settings-btn settings-btn--ghost"
              onClick={() => onUsePreset(p)}
              disabled={addrStatus === 'loading'}
            >
              {p.label}
            </button>
          ))}
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
            onClick={onSaveAsPlace}
          >
            Salva in elenco
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

