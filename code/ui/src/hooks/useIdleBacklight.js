import { useEffect } from 'react'
import {
  getBacklightDimUrl,
  getBacklightRestoreUrl,
} from '../config/runtime.js'

/**
 * Opzionale: chiama URL locali sul Pi per abbassare/ripristinare backlight
 * (`VITE_BACKLIGHT_DIM_URL` / `VITE_BACKLIGHT_RESTORE_URL`).
 *
 * @param {boolean} dimmed — true su idle dashboard o deep idle
 */
export function useIdleBacklight(dimmed) {
  useEffect(() => {
    const dimUrl = getBacklightDimUrl()
    const restoreUrl = getBacklightRestoreUrl()
    if (!dimUrl && !restoreUrl) return undefined

    const ping = (url) => {
      if (!url) return
      void fetch(url, { method: 'GET', keepalive: true }).catch(() => {})
    }

    if (dimmed) ping(dimUrl)

    return () => {
      if (dimmed) ping(restoreUrl)
    }
  }, [dimmed])
}
