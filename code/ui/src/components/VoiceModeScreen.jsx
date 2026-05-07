import VoiceModePlaceholder from './voice/VoiceModePlaceholder.jsx'

export default function VoiceModeScreen() {
  return (
    <div className="voice-mode-screen">
      <p className="voice-mode-screen__label">Voce</p>
      <VoiceModePlaceholder variant="hero" />
    </div>
  )
}
