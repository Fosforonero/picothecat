/**
 * Placeholder stato casa — in futuro da integrazione reale.
 * `facts` struttura la parte secondaria (etichetta + valore leggibile).
 */
export const homeMock = {
  label: 'Tutto tranquillo',
  facts: [
    { label: 'Luci', value: 'Zone notte spente' },
    { label: 'Clima', value: 'Comfort · 21°' },
    { label: 'Accessi', value: 'Nessun alert' },
  ],
}

/** Una riga compatta per viste secondarie (es. sidebar attiva). */
export function homeCompactSummary(home) {
  return home.facts.map((f) => `${f.label}: ${f.value}`).join(' · ')
}
