import { useEffect, useRef } from 'react'

/**
 * Dopo `ms` senza interazione in dashboard idle → deep idle (sleep UI).
 * Reset su pointer/keyboard come useIdleTimeout.
 */
export function useDeepIdleTimeout({ enabled, ms, onDeepIdle }) {
  const ref = useRef(onDeepIdle)

  useEffect(() => {
    ref.current = onDeepIdle
  }, [onDeepIdle])

  useEffect(() => {
    if (!enabled) return undefined

    let timeoutId
    const schedule = () => {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        ref.current()
      }, ms)
    }

    schedule()

    const onActivity = () => {
      schedule()
    }

    const opts = { capture: true }
    window.addEventListener('pointerdown', onActivity, opts)
    window.addEventListener('keydown', onActivity, opts)

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('pointerdown', onActivity, opts)
      window.removeEventListener('keydown', onActivity, opts)
    }
  }, [enabled, ms])
}
