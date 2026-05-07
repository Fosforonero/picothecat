# Sprint: 2026-05-07 — Weather Portability (GPS assistito)

## Sprint Goal
Rendere la posizione meteo **facile e affidabile** quando il dispositivo viene spostato: aggiungere in Impostazioni un’azione “**Usa posizione attuale (GPS)**” che compila i campi (e propone una label) senza rompere i fallback esistenti.

## Why Now
Massimo leverage con minimo rischio: chiude il gap operativo “cambio casa” senza aprire l’integrazione assistente (che richiede contratto API e guardrail sicurezza).

## Scope (in)
- UI settings meteo:
  - bottone “Usa posizione attuale (GPS)”
  - stati chiari: loading / errore (permesso negato, timeout, contesto non sicuro)
  - compilazione lat/lon e (se disponibile) label da reverse geocode
- Nessuna nuova dipendenza.

## Anti-goals (out)
- Non cambiare pipeline deploy (`deploy/push-ui.sh`).
- Non rifattorizzare `useWeather` o l’architettura UI.
- Nessun lavoro assistant/medical oltre l’esistente placeholder.

## Files to Inspect
- `code/ui/src/components/WeatherLocationSettings.jsx`
- `code/ui/src/data/weatherLocation.js`
- `code/ui/src/hooks/useWeather.js`
- `code/ui/README.md` (solo se serve nota UX)

## Files Allowed to Modify
- `code/ui/src/components/WeatherLocationSettings.jsx`
- `code/ui/src/data/weatherLocation.js` (solo helper/guard utili)
- `sprints/2026-05-07-weather-portability/**`

## Risks
- Geolocation flaky (deny/timeout) su kiosk non-secure.
- Confusione tra GPS live vs override manuale: UI deve spiegare che “Salva” crea un override.

## Anti-Regression Requirements
- Meteo non deve diventare “vuoto” se GPS fallisce.
- Override manuale e refresh event `picoclaw-weather-override-changed` restano invariati.

## QA Steps
- Secure context (`http://localhost`) → GPS ok → campi compilati + label proposta.
- Permesso negato/timeout → messaggio chiaro, campi invariati.
- “Salva” → override attivo e meteo si aggiorna.

## GO / NO-GO
- **GO**: UX chiara, zero regressioni, nessuna dipendenza.
- **NO-GO**: refactor di `useWeather` o cambi deploy.

