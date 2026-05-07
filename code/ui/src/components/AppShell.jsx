import { useCallback, useRef, useState } from 'react'
import '../styles/picoclaw.css'
import { useClock } from '../hooks/useClock.js'
import { useThemeMode } from '../hooks/useThemeMode.js'
import {
  getBackendBaseUrl,
  HEALTH_POLL_INTERVAL_MS,
  IDLE_TIMEOUT_MS,
  DEEP_IDLE_TIMEOUT_MS,
} from '../config/runtime.js'
import { useHealth } from '../hooks/useHealth.js'
import { useWeather } from '../hooks/useWeather.js'
import { useIdleBacklight } from '../hooks/useIdleBacklight.js'
import { useIdleTimeout } from '../hooks/useIdleTimeout.js'
import { useDeepIdleTimeout } from '../hooks/useDeepIdleTimeout.js'
import {
  UI_PHASE,
  showsChrome,
  dockActionForPhase,
} from '../navigation/uiPhase.js'
import TopBar from './TopBar.jsx'
import IdleScreen from './IdleScreen.jsx'
import ActiveScreen from './ActiveScreen.jsx'
import BottomDock from './BottomDock.jsx'
import DeepIdleScreen from './DeepIdleScreen.jsx'
import VoiceModeScreen from './VoiceModeScreen.jsx'
import ModePlaceholderScreen from './ModePlaceholderScreen.jsx'
import MedicalScreen from './MedicalScreen.jsx'
import WeatherLocationSettings from './WeatherLocationSettings.jsx'

export default function AppShell() {
  const now = useClock()
  const { weather, sunMinutes, sunTimes, hourlyToday, forecast7, status: weatherStatus } =
    useWeather()
  const themeMode = useThemeMode(now, sunMinutes)

  const backendBase = getBackendBaseUrl()
  const health = useHealth(backendBase, {
    intervalMs: HEALTH_POLL_INTERVAL_MS,
  })

  const [phase, setPhase] = useState(UI_PHASE.IDLE)
  const blockInputUntilRef = useRef(0)

  const backlightDimmed =
    phase === UI_PHASE.IDLE || phase === UI_PHASE.DEEP_IDLE
  useIdleBacklight(backlightDimmed)

  const goIdle = useCallback(() => setPhase(UI_PHASE.IDLE), [])
  const goActive = useCallback(() => setPhase(UI_PHASE.ACTIVE), [])
  const goDeepIdle = useCallback(() => setPhase(UI_PHASE.DEEP_IDLE), [])

  const wakeFromDeepIdle = useCallback(() => {
    // Block the synthetic click/tap that can bubble into the next screen after waking.
    blockInputUntilRef.current = Date.now() + 650
    setPhase(UI_PHASE.IDLE)
  }, [])

  useIdleTimeout({
    enabled: showsChrome(phase),
    ms: IDLE_TIMEOUT_MS,
    onIdle: goIdle,
  })

  useDeepIdleTimeout({
    enabled: phase === UI_PHASE.IDLE,
    ms: DEEP_IDLE_TIMEOUT_MS,
    onDeepIdle: goDeepIdle,
  })

  const onDockAction = useCallback((id) => {
    switch (id) {
      case 'home':
        setPhase(UI_PHASE.IDLE)
        break
      case 'chat':
        setPhase(UI_PHASE.ACTIVE)
        break
      case 'voice':
        setPhase(UI_PHASE.VOICE)
        break
      case 'actions':
        setPhase(UI_PHASE.ACTIONS)
        break
      case 'medical':
        setPhase(UI_PHASE.MEDICAL)
        break
      case 'settings':
        setPhase(UI_PHASE.SETTINGS)
        break
      default:
        break
    }
  }, [])

  const onQuickAction = useCallback((id) => {
    void id
  }, [])

  const shellClass =
    phase === UI_PHASE.DEEP_IDLE
      ? 'app-shell app-shell--deep-idle'
      : phase === UI_PHASE.IDLE
        ? 'app-shell app-shell--idle'
        : 'app-shell'

  const dockActiveId = dockActionForPhase(phase)

  return (
    <div
      className={shellClass}
      onPointerDownCapture={(e) => {
        if (Date.now() < blockInputUntilRef.current) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
      onClickCapture={(e) => {
        if (Date.now() < blockInputUntilRef.current) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
    >
      {showsChrome(phase) ? <TopBar now={now} /> : null}
      <div className="app-body">
        {phase === UI_PHASE.IDLE ? (
          <IdleScreen
            now={now}
            health={health}
            weather={weather}
            forecast7={forecast7}
            hourlyToday={hourlyToday}
            weatherStatus={weatherStatus}
            sunTimes={sunTimes}
            themeMode={themeMode}
            onActivate={goActive}
          />
        ) : null}

        {phase === UI_PHASE.DEEP_IDLE ? (
          <DeepIdleScreen
            now={now}
            weather={weather}
            weatherStatus={weatherStatus}
            onWake={wakeFromDeepIdle}
          />
        ) : null}

        {phase === UI_PHASE.ACTIVE ? (
          <ActiveScreen
            health={health}
            weather={weather}
            onQuickAction={onQuickAction}
          />
        ) : null}

        {phase === UI_PHASE.VOICE ? <VoiceModeScreen /> : null}

        {phase === UI_PHASE.MEDICAL ? <MedicalScreen /> : null}

        {phase === UI_PHASE.SETTINGS ? (
          <WeatherLocationSettings weather={weather} />
        ) : null}

        {phase === UI_PHASE.ACTIONS ? (
          <ModePlaceholderScreen
            title="Stato e azioni"
            subtitle="Riepilogo sensori e scorciatoie contestuali. Contenuto in arrivo."
          />
        ) : null}
      </div>

      {showsChrome(phase) ? (
        <BottomDock activeId={dockActiveId} onAction={onDockAction} />
      ) : null}
    </div>
  )
}
