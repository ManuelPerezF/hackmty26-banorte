'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  ArrowUpRight,
  MessageSquare,
  Plus,
  Wallet,
  Receipt,
  ChartColumn,
  RotateCcw,
  History,
  CreditCard,
  Flag,
  X,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useBank } from '@/modules/cuentas/context/bank-context';
import type { useAsistente } from '../hooks/useAsistente';
import { A2uiRenderer } from './a2ui-renderer';
import '../styles/chat.css';
export function AsistentePanel(a: ReturnType<typeof useAsistente>) {
  const { profile } = useBank();
  const [historyOpen, setHistoryOpen] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const area = scroll.current;
    if (area) area.scrollTop = area.scrollHeight;
  }, [a.messages, a.latest, a.turns, a.error, a.busy]);
  const standalone = a.latest ? a.turns[a.latest] : undefined;
  const hasMessage =
    standalone &&
    a.messages.some(
      (m) => m.role === 'assistant' && m.turnId === standalone.id,
    );
  const welcome = !a.loading && !a.messages.length && !a.busy && !standalone;
  const composer = (
    <form
      className="bank-chat-compose"
      onSubmit={(e) => {
        e.preventDefault();
        void a.send();
      }}
    >
      <label className="sr-only" htmlFor="chat-input">
        Mensaje al asistente
      </label>
      <textarea
        id="chat-input"
        value={a.draft}
        onChange={(e) => a.setDraft(e.target.value)}
        placeholder="Pregunta algo sobre tus cuentas o tus planes…"
        maxLength={4000}
        rows={2}
        disabled={a.busy || a.loading}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void a.send();
          }
        }}
      />
      <Button
        type="submit"
        aria-label="Enviar mensaje"
        disabled={a.busy || a.loading || !a.catalogReady || !a.draft.trim()}
      >
        <ArrowUp size={19} />
      </Button>
      <small>Revisa los datos antes de confirmar un movimiento.</small>
    </form>
  );
  return (
    <section
      className={`bank-chat ${welcome ? 'is-welcome' : ''} ${historyOpen ? 'is-history-open' : ''}`}
      aria-label="Asistente financiero"
    >
      <div className="chat-main">
        <header className="bank-chat-header">
          <span className="chat-agent-mark">
            <Wallet size={18} />
          </span>
          <h2>Asistente Banorte</h2>
          <Button
            variant="ghost"
            className="chat-history-toggle"
            aria-expanded={historyOpen}
            aria-controls="chat-history"
            onClick={() => setHistoryOpen(!historyOpen)}
          >
            <History size={18} /> Historial
          </Button>
        </header>
        <div
          ref={scroll}
          className="chat-scroll"
          aria-busy={a.busy || a.loading}
        >
          {a.loading && (
            <output className="chat-loading">Cargando conversaciones…</output>
          )}
          {welcome && (
            <div className="chat-welcome">
              <span className="chat-welcome-mark" aria-hidden="true">
                <Wallet size={27} strokeWidth={1.35} />
              </span>
              <h3>Hola, {profile.displayName.split(' ')[0]}.</h3>
              <p>Hagamos espacio para tus planes.</p>
              {composer}
              <div className="chat-suggestions">
                <span>PODEMOS EMPEZAR POR AQUÍ</span>
                {[
                  { icon: ChartColumn, text: '¿En qué gasté este mes?' },
                  { icon: Receipt, text: 'Quiero registrar un movimiento' },
                  {
                    icon: CreditCard,
                    text: 'Muéstrame mis cuentas y tarjetas',
                  },
                  { icon: Flag, text: 'Quiero revisar mis metas' },
                  { icon: Wallet, text: 'Ayúdame a simular mi ahorro' },
                ].map(({ icon: Icon, text }) => (
                  <button
                    key={text}
                    disabled={!a.catalogReady || a.busy}
                    onClick={() => {
                      a.setDraft(text);
                      void a.send(text);
                    }}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                    {text}
                    <ArrowUpRight size={15} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {a.messages.map((m) => (
            <article key={m.id} className={`chat-message ${m.role}`}>
              <span className="chat-speaker">
                {m.role === 'user' ? 'Tú' : 'Asistente Banorte'}
              </span>
              {m.role === 'assistant' &&
              m.turnId &&
              a.turns[m.turnId]?.uiSnapshot ? (
                <A2uiRenderer
                  turn={a.turns[m.turnId]}
                  disabled={a.busy}
                  latest={a.latest === m.turnId}
                  onAction={a.act}
                />
              ) : (
                <p>{m.content}</p>
              )}
            </article>
          ))}
          {standalone && !hasMessage && standalone.uiSnapshot && (
            <article className="chat-message assistant">
              <span className="chat-speaker">Asistente Banorte</span>
              <A2uiRenderer
                turn={standalone}
                disabled={a.busy}
                latest
                onAction={a.act}
              />
            </article>
          )}
          {a.busy && (
            <output className="chat-working">
              <i /> Consultando tu información…
            </output>
          )}
          {a.error && (
            <div className="chat-error" role="alert">
              <p>{a.error}</p>
              {a.conversationId && (
                <Button variant="ghost" disabled={a.busy} onClick={a.recover}>
                  <RotateCcw size={15} /> Recuperar conversación
                </Button>
              )}
            </div>
          )}
        </div>
        {!welcome && composer}
      </div>
      <aside
        className="chat-history"
        id="chat-history"
        aria-label="Historial de conversaciones"
      >
        <div className="chat-history-top">
          <Button
            variant="ghost"
            disabled={a.busy || a.loading}
            onClick={() => {
              a.newChat();
              setHistoryOpen(false);
            }}
          >
            <Plus size={17} /> Nueva conversación
          </Button>
          <Button
            variant="ghost"
            className="chat-history-close"
            aria-label="Cerrar historial"
            onClick={() => setHistoryOpen(false)}
          >
            <X size={18} />
          </Button>
        </div>
        <h2>Recientes</h2>
        {a.conversations.length ? (
          <ul>
            {a.conversations.map((c) => (
              <li key={c.id}>
                <button
                  disabled={a.busy || a.loading}
                  aria-current={a.conversationId === c.id ? 'page' : undefined}
                  onClick={() => {
                    void a.open(c.id);
                    setHistoryOpen(false);
                  }}
                >
                  <MessageSquare size={15} />
                  <span>{c.title}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="chat-history-empty">
            <MessageSquare size={24} strokeWidth={1.2} />
            <p>Tus ideas empiezan aquí.</p>
            <small>Encuentra tus conversaciones en este espacio.</small>
          </div>
        )}
      </aside>
    </section>
  );
}
