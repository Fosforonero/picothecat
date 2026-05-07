export default function AssistantMain() {
  return (
    <section className="assistant-main" aria-label="Conversazione">
      <div className="assistant-main__header">Messaggi</div>
      <div className="assistant-main__stream">
        <div className="assistant-bubble assistant-bubble--assistant">
          Sono qui quando vuoi. Più avanti potrai chiedermi cose in
          conversazione.
        </div>
      </div>
      <div className="assistant-main__input-row">
        <div
          className="assistant-main__input"
          role="textbox"
          aria-readonly="true"
          aria-label="Messaggio"
        >
          Scrivi…
        </div>
      </div>
    </section>
  )
}
