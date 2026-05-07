import { useEffect, useState } from 'react'

/**
 * @typedef {'checking' | 'online' | 'offline'} HealthStatus
 */

/**
 * Polling /health sul backend PicoClaw.
 * @param {string} baseUrl — da getBackendBaseUrl(); '' = path relativo `/health`
 * @param {{ intervalMs?: number }} options
 */
export function useHealth(baseUrl, { intervalMs = 20000 } = {}) {
  const [state, setState] = useState({
    /** @type {HealthStatus} */
    status: 'checking',
    lastOkAt: null,
    lastError: null,
  })

  useEffect(() => {
    const controller = new AbortController()
    let intervalId

    const url =
      baseUrl === ''
        ? '/health'
        : `${baseUrl.replace(/\/$/, '')}/health`

    const tick = async () => {
      setState((s) => ({
        ...s,
        status: s.status === 'offline' ? 'checking' : s.status,
      }))
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          cache: 'no-store',
        })
        if (res.ok) {
          setState({
            status: 'online',
            lastOkAt: Date.now(),
            lastError: null,
          })
        } else {
          setState((s) => ({
            ...s,
            status: 'offline',
            lastError: `HTTP ${res.status}`,
          }))
        }
      } catch (e) {
        if (e.name === 'AbortError') return
        // Fallback: se il backend è raggiungibile ma CORS blocca la lettura,
        // una fetch no-cors risolve (risposta opaque) senza throw.
        try {
          await fetch(url, { mode: 'no-cors', cache: 'no-store' })
          setState({
            status: 'online',
            lastOkAt: Date.now(),
            lastError: null,
          })
        } catch {
          setState((s) => ({
            ...s,
            status: 'offline',
            lastError: e?.message ?? 'Errore di rete',
          }))
        }
      }
    }

    tick()
    intervalId = window.setInterval(tick, intervalMs)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [baseUrl, intervalMs])

  return state
}
