import { useEffect, useState } from 'react'

/** Ora corrente aggiornata ogni secondo (orologio live). */
export function useClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date())
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  return now
}
