# PicoClaw UI (Vite + React)

Touch-first fullscreen UI for the PicoClaw display (Raspberry Pi / kiosk).

## Requirements

- Node **20** (see `.nvmrc`)

## Dev

```bash
npm install
npm run dev -- --host 0.0.0.0
```

If this runs on the Raspberry Pi, the kiosk should open **`http://localhost:5173`** (not the LAN IP) to keep browser APIs (like Geolocation) usable.

## Weather (Open‑Meteo)

Weather uses Open‑Meteo forecast API with **configured coordinates** as the reliable baseline.
Optionally it can refine using browser Geolocation when available.

### Configure precise location (recommended for Raspberry / kiosk)

Create `.env.local` (or set env vars at runtime) with:

```bash
VITE_WEATHER_LAT=41.8693
VITE_WEATHER_LON=12.5113
VITE_WEATHER_LABEL="Appio-Latino, Roma"
VITE_WEATHER_USE_GEOLOCATION=false
VITE_WEATHER_USE_GEOIP=true
```

This guarantees that the UI shows the correct **quartiere label** even when the browser blocks GPS.

### Enable browser geolocation (optional)

Set:

```bash
VITE_WEATHER_USE_GEOLOCATION=true
```

Geolocation works only in a **secure context**:
- `https://...` OR
- `http://localhost` / `http://127.0.0.1`

If you open the UI from another device using `http://<pi-ip>:5173`, Chromium will often block Geolocation and the app will fall back to the configured label.

## Raspberry Pi kiosk notes

### Recommended kiosk URL

Use **`http://localhost:5173`** in Chromium kiosk (running on the Pi itself).

Example (manual run):

```bash
chromium-browser --kiosk --app="http://localhost:5173" \\
  --noerrdialogs --disable-infobars --no-first-run \\
  --disable-features=TranslateUI --disable-translate \\
  --overscroll-history-navigation=0
```

### If you must use an insecure origin (not recommended)

Chromium can be forced to treat an origin as secure (so Geolocation can work), but it reduces security:

```bash
chromium-browser --unsafely-treat-insecure-origin-as-secure="http://<pi-ip>:5173" \\
  --app="http://<pi-ip>:5173"
```
