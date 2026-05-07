import { useEffect, useState } from 'react'
import { unlockForKcal } from '../data/medicalUnlocks.js'

const CACHE_KEY = 'picoclaw.medical.v1'

function safeJsonParse(str) {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

function loadCache() {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage?.getItem(CACHE_KEY)
  if (!raw) return null
  const j = safeJsonParse(raw)
  if (!j || typeof j !== 'object') return null
  return j
}

function saveCache(payload) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage?.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

function pickNumber(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k]
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

function normalizeMedical(json) {
  const bpm = pickNumber(json, ['bpm', 'heartRate', 'hr'])
  const steps = pickNumber(json, ['steps', 'stepCount'])
  const calories = pickNumber(json, [
    'calories',
    'kcal',
    'kcalBurned',
    'kcal_burned',
    'activeKcal',
    'active_kcal',
    'caloriesBurned',
  ])
  const sleepMinutes = pickNumber(json, ['sleepMinutes', 'sleep_min', 'sleep'])
  const distanceMeters = pickNumber(json, [
    'distanceMeters',
    'distance_m',
    'distance',
  ])
  const bodyTempC = pickNumber(json, [
    'bodyTempC',
    'body_temp_c',
    'temperatureC',
    'tempC',
  ])
  const spo2 = pickNumber(json, ['spo2', 'SpO2'])
  const ts = json?.ts != null ? String(json.ts) : null

  return {
    ts,
    bpm: bpm != null ? Math.round(bpm) : null,
    steps: steps != null ? Math.round(steps) : null,
    calories: calories != null ? Math.round(calories) : null,
    sleepMinutes: sleepMinutes != null ? Math.round(sleepMinutes) : null,
    distanceMeters: distanceMeters != null ? Math.round(distanceMeters) : null,
    bodyTempC: bodyTempC != null ? Number(bodyTempC) : null,
    spo2: spo2 != null ? Math.round(spo2) : null,
    unlock: unlockForKcal(calories),
  }
}

export function useMedical(baseUrl, { intervalMs = 20000 } = {}) {
  const [state, setState] = useState(() => {
    const cached = loadCache()
    if (cached?.data) return { status: 'ready', data: cached.data, lastError: null }
    return { status: 'loading', data: null, lastError: null }
  })

  useEffect(() => {
    let alive = true
    const controller = new AbortController()
    const url =
      baseUrl === '' ? '/api/medical' : `${baseUrl.replace(/\/$/, '')}/api/medical`

    const tick = async () => {
      if (!alive) return
      setState((s) => ({ ...s, status: s.data ? 'ready' : 'loading' }))
      try {
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const data = normalizeMedical(json)
        if (!alive) return
        setState({ status: 'ready', data, lastError: null })
        saveCache({ ts: Date.now(), data })
      } catch (e) {
        if (e?.name === 'AbortError') return
        if (!alive) return
        setState((s) => ({
          ...s,
          status: s.data ? 'ready' : 'error',
          lastError: e?.message ?? 'Errore rete',
        }))
      }
    }

    tick()
    const id = window.setInterval(tick, intervalMs)
    return () => {
      alive = false
      controller.abort()
      window.clearInterval(id)
    }
  }, [baseUrl, intervalMs])

  return state
}

