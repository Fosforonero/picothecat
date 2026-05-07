import { useMemo, useRef, useState } from 'react'

export default function AssistantMain() {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState(() => [
    {
      id: 'm0',
      role: 'assistant',
      text: 'Sono qui quando vuoi. Più avanti potrai chiedermi cose in conversazione.',
    },
  ])
  const inputRef = useRef(null)

  const canSend = useMemo(() => String(draft).trim() !== '', [draft])

  const onSend = (e) => {
    e.preventDefault()
    const text = String(draft).trim()
    if (!text) return
    setDraft('')
    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, role: 'user', text },
    ])
    // Placeholder: backend integration comes next.
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: 'Ricevuto. (Collegamento assistant in arrivo)',
        },
      ])
    }, 350)
    window.setTimeout(() => inputRef.current?.focus?.(), 0)
  }

  return (
    <section className="assistant-main" aria-label="Conversazione">
      <div className="assistant-main__header">Messaggi</div>
      <div className="assistant-main__stream" role="log" aria-live="polite">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`assistant-bubble assistant-bubble--${m.role}`}
          >
            {m.text}
          </div>
        ))}
      </div>
      <form className="assistant-main__input-row" onSubmit={onSend}>
        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          enterKeyHint="send"
          className="assistant-main__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPointerDown={() => inputRef.current?.focus?.()}
          placeholder="Scrivi…"
          aria-label="Messaggio"
          autoFocus
        />
        <button
          type="submit"
          className="assistant-main__send"
          disabled={!canSend}
        >
          Invia
        </button>
      </form>
    </section>
  )
}
