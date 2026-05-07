/**
 * Placeholder meteo — fallback se Open-Meteo non risponde.
 * `condition` guida skin CSS + glifo (non logica meteo).
 *
 * @typedef {'sunny' | 'cloudy' | 'rainy' | 'clear' | 'thunderstorm' | 'snow' | 'windy' | 'mist'} WeatherConditionKey
 *
 * @typedef {Object} WeatherDisplay
 * @property {string} summary
 * @property {string} highLow
 * @property {string} location
 * @property {WeatherConditionKey} condition
 * @property {number | null} temperatureNow
 */

/** @type {WeatherDisplay} */
export const weatherMock = {
  summary: 'Sereno',
  highLow: '24° / 16°',
  location: 'Posizione configurata',
  condition: 'sunny',
  temperatureNow: 20,
}

/**
 * Chiave visiva per skin CSS + icona (notte serena da sunny/clear in dark).
 * @param {{ condition: WeatherConditionKey }} weather
 * @param {'light' | 'dark'} themeMode
 */
export function getWeatherVisualKey(weather, themeMode) {
  const { condition } = weather

  if (condition === 'thunderstorm') return 'thunderstorm'
  if (condition === 'snow') return 'snow'
  if (condition === 'windy') return 'windy'
  if (condition === 'mist') return 'mist'
  if (condition === 'cloudy') return 'cloudy'
  if (condition === 'rainy') return 'rainy'

  if (themeMode === 'dark' && (condition === 'sunny' || condition === 'clear')) {
    return 'clear_night'
  }
  if (condition === 'clear') return 'sunny'
  return 'sunny'
}
