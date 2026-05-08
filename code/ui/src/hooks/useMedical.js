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
  // Supporta anche payload incapsulati (es. { data: {...} } o { latest: {...} }).
  const root =
    json && typeof json === 'object'
      ? json.data && typeof json.data === 'object'
        ? json.data
        : json.record && typeof json.record === 'object'
          ? json.record
        : json.latest && typeof json.latest === 'object'
          ? json.latest
          : json
      : json
  const bpm = pickNumber(root, ['bpm', 'heartRate', 'hr', 'heartRateBpm'])
  const steps = pickNumber(root, ['steps', 'stepCount'])
  const calories = pickNumber(root, [
    'calories',
    'kcal',
    'kcalBurned',
    'kcal_burned',
    'activeKcal',
    'active_kcal',
    'caloriesBurned',
    'caloriesKcal',
  ])
  const sleepMinutes = pickNumber(root, ['sleepMinutes', 'sleep_min', 'sleep'])
  const sleepStages = pickStages(root, [
    'sleepStages',
    'sleep_stages',
    'sleepPhases',
    'sleep_phases',
    'stages',
  ])
  let sleepStagesFromJson = null
  if (!sleepStages) {
    const raw = root?.sleepStagesJson
    if (typeof raw === 'string' && raw.trim().startsWith('[')) {
      const parsed = safeJsonParse(raw)
      if (Array.isArray(parsed)) {
        sleepStagesFromJson = parsed
          .map((s) => {
            if (!s || typeof s !== 'object') return null
            const stage = s.stage != null ? String(s.stage) : ''
            const startMs = Number(s.startMs ?? s.start ?? s.from)
            const endMs = Number(s.endMs ?? s.end ?? s.to)
            if (!stage || !Number.isFinite(startMs) || !Number.isFinite(endMs))
              return null
            return {
              stage: String(stage).toLowerCase(),
              start: new Date(startMs).toISOString(),
              end: new Date(endMs).toISOString(),
            }
          })
          .filter(Boolean)
      }
    }
  }
  const distanceMeters = pickNumber(root, [
    'distanceMeters',
    'distance_m',
    'distance',
  ])
  const bodyTempC = pickNumber(root, [
    'bodyTempC',
    'body_temp_c',
    'temperatureC',
    'tempC',
  ])
  const spo2 = pickNumber(root, ['spo2', 'SpO2'])
  const ts =
    root?.ts != null
      ? String(root.ts)
      : root?.receivedAt != null
        ? String(root.receivedAt)
        : root?.collectedAtMillis != null && Number.isFinite(Number(root.collectedAtMillis))
          ? new Date(Number(root.collectedAtMillis)).toISOString()
          : null

  return {
    ts,
    bpm: bpm != null ? Math.round(bpm) : null,
    steps: steps != null ? Math.round(steps) : null,
    calories: calories != null ? Math.round(calories) : null,
    sleepMinutes: sleepMinutes != null ? Math.round(sleepMinutes) : null,
    sleepStages: sleepStages ?? sleepStagesFromJson,
    distanceMeters: distanceMeters != null ? Math.round(distanceMeters) : null,
    bodyTempC: bodyTempC != null ? Number(bodyTempC) : null,
    spo2: spo2 != null ? Math.round(spo2) : null,
    unlock: unlockForKcal(calories),
  }
}

export function useMedical(baseUrl, { intervalMs = 20000, deviceId = '' } = {}) {
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
        weekly: [],
        recent: [],
      }
    }
    return {
      status: 'loading',
      data: null,
      lastError: null,
      history,
      lastUrl: null,
      lastHttpStatus: null,
      weekly: [],
      recent: [],
    }
  })

  useEffect(() => {
    let alive = true
    const controller = new AbortController()
    const base = baseUrl ? baseUrl.replace(/\/$/, '') : ''
    const qs = deviceId ? `?deviceId=${encodeURIComponent(String(deviceId))}` : ''
    const urlLatest = base ? `${base}/api/v1/sync/latest${qs}` : null
    const urlWeekly = base ? `${base}/api/v1/sync/weekly${qs}` : null
    const urlRecent = base
      ? `${base}/api/v1/sync/recent?limit=48${deviceId ? `&deviceId=${encodeURIComponent(String(deviceId))}` : ''}`
      : null

    const tick = async () => {
      if (!alive) return
      setState((s) => ({ ...s, status: s.data ? 'ready' : 'loading' }))
      try {
        if (!urlLatest) throw new Error('Missing base url')

        const [latestRes, weeklyRes, recentRes] = await Promise.all([
          fetch(urlLatest, { signal: controller.signal, cache: 'no-store' }),
          urlWeekly
            ? fetch(urlWeekly, { signal: controller.signal, cache: 'no-store' })
            : Promise.resolve(null),
          urlRecent
            ? fetch(urlRecent, { signal: controller.signal, cache: 'no-store' })
            : Promise.resolve(null),
        ])

        if (!latestRes.ok) throw new Error(`HTTP ${latestRes.status} (${urlLatest})`)
        const latestJson = await latestRes.json()
        const data = normalizeMedical(latestJson)

        let weekly = []
        if (weeklyRes && weeklyRes.ok) {
          const j = await weeklyRes.json()
          weekly = Array.isArray(j?.days) ? j.days : []
        }
        let recent = []
        if (recentRes && recentRes.ok) {
          const j = await recentRes.json()
          recent = Array.isArray(j?.records) ? j.records : []
        }

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
            lastUrl: urlLatest,
            lastHttpStatus: latestRes.status,
            weekly,
            recent,
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

    const forceRefresh = () => {
      if (!alive) return
      void tick()
    }

    tick()
    const id = window.setInterval(tick, intervalMs)

    const onOnline = () => forceRefresh()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') forceRefresh()
    }
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      alive = false
      controller.abort()
      window.clearInterval(id)
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [baseUrl, intervalMs, deviceId])

  return state
}

