/**
 * Placeholder HVAC / interno — in futuro da termostato o backend.
 *
 * @typedef {'heating' | 'cooling' | 'dehumid' | 'off'} HvacMode
 */

/** @type {{ temperature: string, mode: HvacMode }} */
export const climateMock = {
  temperature: '22,5°',
  mode: 'heating',
}

/** @param {HvacMode} mode */
export function hvacModeLabel(mode) {
  switch (mode) {
    case 'heating':
      return 'Riscaldamento'
    case 'cooling':
      return 'Raffrescamento'
    case 'dehumid':
      return 'Deumidificazione'
    default:
      return 'Stand-by'
  }
}
