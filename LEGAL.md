# LEGAL / PRIVACY (v1 placeholder)

Questo file definisce confini minimi; non è consulenza legale.

## Dati personali
- Evitare di raccogliere/trasmettere dati personali non necessari.
- Non loggare coordinate GPS o dati medici in chiaro su device o rete senza policy esplicita.

## Medical
- La schermata medica non deve fare “diagnosi” o claim clinici.
- Prima di integrare dati reali: definire consenso, retention, access control, threat model.

## Secrets
- Non versionare `.env*` reali, chiavi SSH, token.
- `deploy/push-ui.local.env` è locale e deve restare fuori da git.

