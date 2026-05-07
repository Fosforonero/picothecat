import { useEffect, useState } from 'react'

const KEY = 'picoclaw.settings.units.v1'

function safeJsonParse(str) {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

function loadUnits() {
  if (typeof window === 'undefined') return { wind: 'ms' }
  const raw = window.localStorage?.getItem(KEY)
  if (!raw) return { wind: 'ms' }
  const j = safeJsonParse(raw)
  const wind = j?.wind
  if (wind === 'ms' || wind === 'kn' || wind === 'kmh') return { wind }
  return { wind: 'ms' }
}

function saveUnits(units) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage?.setItem(KEY, JSON.stringify(units))
  } catch {
    // ignore
  }
}

export function useUnits() {
  const [units, setUnits] = useState(() => loadUnits())

  useEffect(() => {
    const onStorage = () => setUnits(loadUnits())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setWindUnit = (wind) => {
    const next = { ...units, wind }
    setUnits(next)
    saveUnits(next)
  }

  return { units, setWindUnit }
}

