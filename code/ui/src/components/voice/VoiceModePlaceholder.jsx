/**
 * Slot futuro: pipeline audio → STT → backend (nessuna logica ora).
 * @param {{ variant?: 'inline' | 'hero' }} props
 */
export default function VoiceModePlaceholder({ variant = 'inline' }) {
  const cls =
    variant === 'hero'
      ? 'voice-placeholder voice-placeholder--hero'
      : 'voice-placeholder'

  if (variant === 'hero') {
    return (
      <div className={cls} aria-label="Voce">
        <span className="voice-placeholder__lead">In ascolto</span>
        <span className="voice-placeholder__muted">
          La conversazione vocale sarà disponibile qui.
        </span>
      </div>
    )
  }

  return (
    <div className={cls} aria-label="Voce">
      Voce · in arrivo in una prossima versione.
    </div>
  )
}
