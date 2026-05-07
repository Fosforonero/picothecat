/** Barra minimale solo in modalità attiva (contesto + ora). */
export default function TopBar({ now }) {
  const smallTime = now.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <header className="top-bar top-bar--active">
      <span className="top-bar__brand">PicoClaw</span>
      <span className="top-bar__meta" aria-live="polite">
        {smallTime}
      </span>
    </header>
  )
}
