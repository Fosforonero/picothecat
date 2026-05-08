import { useEffect, useState } from 'react'
import { unlockForKcal } from '../data/medicalUnlocks.js'

const CACHE_KEY = 'picoclaw.medical.v1'
const HISTORY_KEY = 'picoclaw.medical.history.v1'
const HISTORY_MAX = 96

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

function loadHistory() {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage?.getItem(HISTORY_KEY)
  if (!raw) return []
  const j = safeJsonParse(raw)
  if (!Array.isArray(j)) return []
  return j.filter((x) => x && typeof x === 'object')
}

function saveHistory(items) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage?.setItem(HISTORY_KEY, JSON.stringify(items))
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

function pickStages(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k]
    if (!Array.isArray(v)) continue
    const out = v
      .map((s) => {
        if (!s || typeof s !== 'object') return null
        const stageRaw = s.stage ?? s.phase ?? s.type ?? s.state
        const startRaw = s.start ?? s.from ?? s.t0 ?? s.tsStart
        const endRaw = s.end ?? s.to ?? s.t1 ?? s.tsEnd
        const stage = stageRaw != null ? String(stageRaw).toLowerCase() : ''
        const start = startRaw != null ? String(startRaw) : ''
        const end = endRaw != null ? String(endRaw) : ''
        if (!stage || !start || !end) return null
        return { stage, start, end }
      })
      .filter(Boolean)
    if (out.length) return out
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
  const sleepStages = pickStages(json, [
    'sleepStages',
    'sleep_stages',
    'sleepPhases',
    'sleep_phases',
    'stages',
  ])
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
    sleepStages,
    distanceMeters: distanceMeters != null ? Math.round(distanceMeters) : null,
    bodyTempC: bodyTempC != null ? Number(bodyTempC) : null,
    spo2: spo2 != null ? Math.round(spo2) : null,
    unlock: unlockForKcal(calories),
  }
}

export function useMedical(baseUrl, { intervalMs = 20000 } = {}) {
  const [state, setState] = useState(() => {
    const cached = loadCache()
    const history = loadHistory()
    if (cached?.data) {
      return {
        status: 'ready',
        data: cached.data,
        lastError: null,
        history,
        lastUrl: null,
        lastHttpStatus: null,
      }
    }
    return {
      status: 'loading',
      data: null,
      lastError: null,
      history,
      lastUrl: null,
      lastHttpStatus: null,
    }
  })

  useEffect(() => {
    let alive = true
    const controller = new AbortController()
    const base =
      baseUrl === ''
        ? import.meta.env?.DEV
          ? ''
          : 'http://127.0.0.1:8787'
        : baseUrl.replace(/\/$/, '')
    const candidates = [
      base ? `${base}/api/medical` : null,
      base ? `${base}/api/medical/latest` : null,
      '/api/medical',
      '/api/medical/latest',
    ].filter(Boolean)

    const tick = async () => {
      if (!alive) return
      setState((s) => ({ ...s, status: s.data ? 'ready' : 'loading' }))
      try {
        /** @type {any} */
        let json = null
        let lastHttpErr = null
        let lastUrl = null
        let lastHttpStatus = null
        for (const url of candidates) {
          try {
            const res = await fetch(url, {
              signal: controller.signal,
              cache: 'no-store',
            })
            lastUrl = url
            lastHttpStatus = res.status
            if (!res.ok) {
              lastHttpErr = `HTTP ${res.status} (${url})`
              continue
            }
            json = await res.json()
            break
          } catch (e) {
            // Network/CORS error: try next candidate.
            lastUrl = url
            lastHttpStatus = null
            lastHttpErr = `${e?.message ?? 'Failed to fetch'} (${url})`
          }
        }
        if (json == null) throw new Error(lastHttpErr ?? 'Failed to fetch')

        const data = normalizeMedical(json)
        if (!alive) return
        setState((s) => {
          const nextHistory = [
            ...s.history,
            {
              t: Date.now(),
              bpm: data.bpm,
              steps: data.steps,
              calories: data.calories,
              sleepMinutes: data.sleepMinutes,
              distanceMeters: data.distanceMeters,
              bodyTempC: data.bodyTempC,
              spo2: data.spo2,
            },
          ].slice(-HISTORY_MAX)
          saveHistory(nextHistory)
          return {
            status: 'ready',
            data,
            lastError: null,
            history: nextHistory,
            lastUrl,
            lastHttpStatus,
          }
        })
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

