/** Fasi shell PicoClaw — navigazione senza router. */
export const UI_PHASE = {
  IDLE: 'idle',
  ACTIVE: 'active',
  DEEP_IDLE: 'deepIdle',
  VOICE: 'voice',
  MEDICAL: 'medical',
  SETTINGS: 'settings',
  ACTIONS: 'actions',
}

/** Mostra top bar + dock (modalità “operativa”). */
export function showsChrome(phase) {
  return (
    phase === UI_PHASE.ACTIVE ||
    phase === UI_PHASE.VOICE ||
    phase === UI_PHASE.MEDICAL ||
    phase === UI_PHASE.SETTINGS ||
    phase === UI_PHASE.ACTIONS
  )
}

export function dockActionForPhase(phase) {
  if (phase === UI_PHASE.ACTIVE) return 'chat'
  if (phase === UI_PHASE.VOICE) return 'voice'
  if (phase === UI_PHASE.MEDICAL) return 'medical'
  if (phase === UI_PHASE.SETTINGS) return 'settings'
  if (phase === UI_PHASE.ACTIONS) return 'actions'
  return 'home'
}
