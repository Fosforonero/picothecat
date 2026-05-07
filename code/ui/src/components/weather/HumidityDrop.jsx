/**
 * Icona umidità coerente con WeatherGlyph (stroke round).
 * @param {{ className?: string }} props
 */
export default function HumidityDrop({ className = '' }) {
  return (
    <span className={`humidity-drop ${className}`.trim()} aria-hidden>
      <svg
        className="humidity-drop__svg"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2c3.6 5.2 7 8.5 7 13a7 7 0 1 1-14 0c0-4.5 3.4-7.8 7-13z"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

