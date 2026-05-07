import { useEffect, useRef } from 'react'

/**
 * Dopo `ms` senza pointer/keyboard, chiama onIdle. Attivo solo se enabled (es. modalità active).
 */
export function useIdleTimeout({ enabled, ms, onIdle }) {
  const onIdleRef = useRef(onIdle)

  useEffect(() => {
    onIdleRef.current = onIdle
  }, [onIdle])

  useEffect(() => {
    if (!enabled) return undefined

    let timeoutId
    const schedule = () => {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        onIdleRef.current()
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
