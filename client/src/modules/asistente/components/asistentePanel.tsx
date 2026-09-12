'use client';
import { useEffect, useRef } from 'react';
import {
  ArrowUp,
  MessageSquare,
  Plus,
  Wallet,
  Receipt,
  ChartColumn,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useBank } from '@/modules/cuentas/context/bank-context';
import type { useAsistente } from '../hooks/useAsistente';
import { A2uiRenderer } from './a2ui-renderer';
import '../styles/chat.css';
export function AsistentePanel(a: ReturnType<typeof useAsistente>) {
  const { profile } = useBank();
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
  return (
    <section className="bank-chat" aria-label="Asistente financiero">
      <aside className="chat-history">
        <Button variant="ghost" disabled={a.busy} onClick={a.newChat}>
          <Plus size={17} /> Nueva conversación
        </Button>
        <h2>Conversaciones</h2>
        {a.conversations.length ? (
          <ul>
            {a.conversations.map((c) => (
              <li key={c.id}>
                <button
                  disabled={a.busy}
                  aria-current={a.conversationId === c.id ? 'page' : undefined}
                  onClick={() => {
                    void a.open(c.id);
                  }}
                >
                  <MessageSquare size={14} />
                  <span>{c.title}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Tus conversaciones aparecerán aquí.</p>
        )}
      </aside>
      <div className="chat-main">
        <header className="bank-chat-header">
          <span className="chat-agent-mark">
            <Wallet size={20} />
          </span>
          <div>
            <h2>Tu asistente financiero</h2>
            <p>Consulta, entiende y organiza tu dinero.</p>
          </div>
        </header>
        <div
          ref={scroll}
          className="chat-scroll"
          aria-busy={a.busy || a.loading}
        >
          {a.loading ? (
            <p className="chat-loading">Cargando conversaciones…</p>
          ) : !a.messages.length && !a.busy ? (
            <div className="chat-welcome">
              <span>UN POCO MÁS DE CLARIDAD</span>
              <h3>
                ¿Qué quieres entender
                <br />
                de tu dinero, {profile.displayName.split(' ')[0]}?
              </h3>
              <p>
                Podemos revisar tus gastos, registrar un movimiento o pensar en
                tu próxima meta.
              </p>
              <div className="chat-suggestions">
                {[
                  { icon: ChartColumn, text: '¿En qué gasté este mes?' },
                  { icon: Receipt, text: 'Quiero registrar un gasto' },
                  { icon: Wallet, text: '¿Cómo puedo empezar a ahorrar?' },
                ].map(({ icon: Icon, text }) => (
                  <button
                    key={text}
                    disabled={!a.catalogReady || a.busy}
                    onClick={() => {
                      a.setDraft(text);
                      void a.send(text);
                    }}
                  >
                    <Icon size={18} />
                    {text}
                    <span>↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
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
            disabled={a.busy}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                void a.send();
              }
            }}
          />
          <Button
            type="submit"
            aria-label="Enviar mensaje"
            disabled={a.busy || !a.catalogReady || !a.draft.trim()}
          >
            <ArrowUp size={19} />
          </Button>
          <small>Revisa los datos antes de confirmar un movimiento.</small>
        </form>
      </div>
    </section>
  );
}
