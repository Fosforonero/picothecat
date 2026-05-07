import { useEffect, useId, useRef, useState } from 'react'

/**
 * Glifi meteo semplificati (viewBox 48×48) — forme grasse, leggibili a distanza.
 * @param {{ variant: string, animateMs?: number }} props
 */

const STATIC_ASSET = {
  sunny: new URL('../../assets/weather-amcharts/static/day.svg', import.meta.url)
    .href,
  clear_night: new URL(
    '../../assets/weather-amcharts/static/night.svg',
    import.meta.url,
  ).href,
  cloudy: new URL(
    '../../assets/weather-amcharts/static/cloudy.svg',
    import.meta.url,
  ).href,
  rainy: new URL(
    '../../assets/weather-amcharts/static/rainy-6.svg',
    import.meta.url,
  ).href,
  thunderstorm: new URL(
    '../../assets/weather-amcharts/static/thunder.svg',
    import.meta.url,
  ).href,
  snow: new URL(
    '../../assets/weather-amcharts/static/snowy-6.svg',
    import.meta.url,
  ).href,
}

const ANIMATED_ASSET = {
  sunny: new URL(
    '../../assets/weather-amcharts/animated/day.svg',
    import.meta.url,
  ).href,
  clear_night: new URL(
    '../../assets/weather-amcharts/animated/night.svg',
    import.meta.url,
  ).href,
  cloudy: new URL(
    '../../assets/weather-amcharts/animated/cloudy.svg',
    import.meta.url,
  ).href,
  rainy: new URL(
    '../../assets/weather-amcharts/animated/rainy-6.svg',
    import.meta.url,
  ).href,
  thunderstorm: new URL(
    '../../assets/weather-amcharts/animated/thunder.svg',
    import.meta.url,
  ).href,
  snow: new URL(
    '../../assets/weather-amcharts/animated/snowy-6.svg',
    import.meta.url,
  ).href,
}

const CAP = 'round'
const JOIN = 'round'
const W = 3.2

function SunnyInner() {
  return (
    <g fill="currentColor" stroke="currentColor" strokeLinecap={CAP}>
      {/* Disco solare dominante + raggi corti e spessi */}
      <circle cx="24" cy="24" r="12" opacity="0.95" />
      <g strokeWidth={W} fill="none" opacity="0.9">
        <line x1="24" y1="2" x2="24" y2="9" />
        <line x1="24" y1="39" x2="24" y2="46" />
        <line x1="2" y1="24" x2="9" y2="24" />
        <line x1="39" y1="24" x2="46" y2="24" />
        <line x1="8" y1="8" x2="13" y2="13" />
        <line x1="35" y1="35" x2="40" y2="40" />
        <line x1="40" y1="8" x2="35" y2="13" />
        <line x1="13" y1="35" x2="8" y2="40" />
      </g>
    </g>
  )
}

function CloudyInner() {
  return (
    <path
      d="M12 38h28c5 0 9-4 9-9 0-5-4-9-9-9-1-8-8-14-16-14-7 0-13 5-14 12-6 1-10 6-10 12 0 7 6 12 12 12z"
      fill="none"
      stroke="currentColor"
      strokeWidth={W}
      strokeLinejoin={JOIN}
      opacity="0.88"
    />
  )
}

function RainyInner() {
  return (
    <g stroke="currentColor" strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <path
        d="M10 32h30c4 0 7-3 7-7 0-4-3-6-6-7-1-7-7-12-14-12-6 0-11 4-12 10-5 1-8 5-8 9 0 5 4 7 9 7z"
        fill="none"
        strokeWidth={W}
        opacity="0.82"
      />
      <g strokeWidth={W} opacity="0.88">
        <line x1="15" y1="36" x2="15" y2="46" />
        <line x1="24" y1="34" x2="24" y2="47" />
        <line x1="33" y1="36" x2="33" y2="46" />
      </g>
    </g>
  )
}

function ThunderInner() {
  return (
    <g stroke="currentColor" strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <path
        d="M12 30h26c4 0 7-3 7-7 0-4-3-5-6-6-1-6-6-10-12-10-5 0-9 3-10 8-4 1-7 4-7 8 0 4 3 7 8 7z"
        fill="none"
        strokeWidth={W}
        opacity="0.78"
      />
      <path
        fill="currentColor"
        stroke="none"
        d="M27 5 L15 25h10l-8 18 18-22h-11z"
        opacity="0.9"
      />
    </g>
  )
}

function SnowInner() {
  return (
    <g
      stroke="currentColor"
      strokeWidth={W}
      strokeLinecap={CAP}
      opacity="0.88"
    >
      <line x1="24" y1="6" x2="24" y2="42" />
      <line x1="6" y1="24" x2="42" y2="24" />
      <line x1="10" y1="10" x2="38" y2="38" />
      <line x1="38" y1="10" x2="10" y2="38" />
    </g>
  )
}

function WindyInner() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth={W} strokeLinecap={CAP}>
      <path d="M6 16h28c6 0 6-6 12-6" opacity="0.85" />
      <path d="M8 26h24c5 0 5-5 10-5" opacity="0.88" />
      <path d="M6 36h30c5 0 6 5 11 5" opacity="0.82" />
    </g>
  )
}

function MistInner() {
  return (
    <g stroke="currentColor" strokeWidth={W} strokeLinecap={CAP}>
      <line x1="6" y1="14" x2="42" y2="14" opacity="0.72" />
      <line x1="8" y1="24" x2="40" y2="24" opacity="0.78" />
      <line x1="4" y1="34" x2="44" y2="34" opacity="0.74" />
    </g>
  )
}

/** Luna compatta nel viewBox (evita overflow quando lo SVG è scalato nella card). */
function ClearNightInner() {
  const raw = useId()
  const maskId = `wg-moon-${raw.replace(/:/g, '')}`

  return (
    <g fill="currentColor">
      <defs>
        <mask id={maskId}>
          <rect width="48" height="48" fill="white" />
          <circle cx="29" cy="20" r="8" fill="black" />
        </mask>
      </defs>
      <circle
        cx="22"
        cy="24"
        r="11"
        mask={`url(#${maskId})`}
        opacity="0.9"
      />
    </g>
  )
}

const INNER = {
  sunny: SunnyInner,
  cloudy: CloudyInner,
  rainy: RainyInner,
  thunderstorm: ThunderInner,
  snow: SnowInner,
  windy: WindyInner,
  mist: MistInner,
  clear_night: ClearNightInner,
}

export default function WeatherGlyph({ variant, animateMs = 5000 }) {
  const staticUrl = STATIC_ASSET[variant]
  const animatedUrl = ANIMATED_ASSET[variant]
  const Cmp = INNER[variant] ?? INNER.sunny
  const [showAnimated, setShowAnimated] = useState(false)
  const lastVariantRef = useRef(variant)

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (prefersReduced) return
    if (!animatedUrl || !staticUrl) return

    const changed = lastVariantRef.current !== variant
    lastVariantRef.current = variant

    // Animate on first mount and on variant change.
    if (!changed && showAnimated) return
    setShowAnimated(true)
    const id = window.setTimeout(() => setShowAnimated(false), animateMs)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, animatedUrl, staticUrl, animateMs])

  const assetUrl = showAnimated ? animatedUrl : staticUrl

  return (
    <span className="weather-glyph" aria-hidden>
      {assetUrl ? (
        <img
          className="weather-glyph__img"
          src={assetUrl}
          alt=""
          onError={() => setShowAnimated(false)}
        />
      ) : (
        <svg
          className="weather-glyph__svg"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <Cmp />
        </svg>
      )}
    </span>
  )
}
