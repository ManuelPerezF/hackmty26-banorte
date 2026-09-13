'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  ArrowUpRight,
  MessageSquare,
  Plus,
  PiggyBank,
  Receipt,
  ChartColumn,
  RotateCcw,
  History,
  CreditCard,
  Flag,
  HeartPulse,
  Mic,
  MicOff,
  Scale,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useBank } from '@/modules/cuentas/context/bank-context';
import type { useAsistente } from '../hooks/useAsistente';
import { useDictation } from '../hooks/useDictation';
import { MayaClip } from './maya-clip';
import { MayaMark } from './maya-mark';
import { A2uiRenderer } from './a2ui-renderer';
import { DocumentConsultation } from './document-consultation';
import '../styles/chat.css';
/**
 * Atajos de bienvenida por modo. El coach abre con lo que se puede hacer; el
 * analista con lo que se puede medir. Ninguno inventa capacidades: cada frase
 * cae en un bloque que el servidor ya sabe construir.
 */
const SUGGESTIONS = {
  coach: [
    { icon: Sparkles, text: '¿Qué me sugieres para este mes?' },
    { icon: HeartPulse, text: '¿Cómo va mi salud financiera?' },
    { icon: Flag, text: 'Ayúdame a avanzar en mis metas' },
    { icon: PiggyBank, text: 'Ayúdame a simular mi ahorro' },
    { icon: Receipt, text: 'Quiero registrar un movimiento' },
  ],
  analyst: [
    { icon: TrendingUp, text: '¿Cómo voy a cerrar el mes?' },
    { icon: ChartColumn, text: '¿En qué gasté este mes?' },
    { icon: Scale, text: 'Compara este mes con el anterior' },
    { icon: Wallet, text: '¿Cómo van mis presupuestos?' },
    { icon: CreditCard, text: '¿Cuántos puntos generé con mis tarjetas?' },
  ],
} as const;

export function AsistentePanel(a: ReturnType<typeof useAsistente>) {
  const { profile } = useBank();
  // null = sin decisión del usuario: manda el default del CSS (abierto en escritorio, cerrado en móvil)
  const [historyOpen, setHistoryOpen] = useState<boolean | null>(null);
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 851px)');
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  const historyVisible = historyOpen ?? wide;
  const { setDraft } = a;
  const appendDictation = useCallback(
    (text: string) =>
      setDraft((current: string) => (current ? `${current} ${text}` : text)),
    [setDraft],
  );
  const dictation = useDictation(appendDictation);
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const area = scroll.current;
    if (area) area.scrollTop = area.scrollHeight;
  }, [a.messages.length, a.error]);
  const standalone = a.latest ? a.turns[a.latest] : undefined;
  const hasMessage =
    standalone &&
    a.messages.some(
      (m) => m.role === 'assistant' && m.turnId === standalone.id,
    );
  const welcome = !a.loading && !a.messages.length && !a.busy && !standalone;
  const documents = (
    <DocumentConsultation
      key={a.conversationId ?? 'new'}
      disabled={!a.catalogReady || a.busy || a.loading}
      onConsult={(question) => {
        a.setDraft(question);
        void a.send(question);
      }}
    />
  );
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
      {dictation.supported && (
        <Button
          type="button"
          variant="ghost"
          className="chat-dictate"
          aria-label={dictation.listening ? 'Detener dictado' : 'Dictar mensaje'}
          aria-pressed={dictation.listening}
          disabled={a.busy || a.loading}
          onClick={dictation.toggle}
        >
          {dictation.listening ? <MicOff size={18} /> : <Mic size={18} />}
        </Button>
      )}
      <Button
        type="submit"
        aria-label="Enviar mensaje"
        disabled={a.busy || a.loading || !a.catalogReady || !a.draft.trim()}
      >
        <ArrowUp size={19} />
      </Button>
      <small>
        {dictation.error || 'Revisa los datos antes de confirmar un cambio.'}
      </small>
    </form>
  );
  return (
    <section
      className={`bank-chat ${welcome ? 'is-welcome' : ''} ${
        historyOpen === null
          ? ''
          : historyOpen
            ? 'is-history-open'
            : 'is-history-closed'
      }`}
      aria-label="Asistente financiero"
    >
      <div className="chat-main">
        <header className="bank-chat-header">
          <MayaClip name="maya-idle" loop className="maya-mark-header" />
          <div className="maya-lockup">
            <h2>Maya</h2>
            <p>Asistente Banorte</p>
          </div>
          <fieldset
            className="chat-mode"
            aria-label="Tono del asistente"
            disabled={a.busy || a.loading}
          >
            {(['coach', 'analyst'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={a.mode === m}
                onClick={() => a.setMode(m)}
              >
                {m === 'coach' ? 'Coach' : 'Analista'}
              </button>
            ))}
          </fieldset>
          <Button
            variant="ghost"
            className="chat-history-toggle"
            aria-expanded={historyVisible}
            aria-controls="chat-history"
            onClick={() => setHistoryOpen(!historyVisible)}
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
              <MayaClip name="maya-entrada" className="chat-welcome-mark" />
              <h3>Hola, {profile.displayName.split(' ')[0]}.</h3>
              <p>Hagamos espacio para tus planes.</p>
              {composer}
              <div className="chat-suggestions">
                <span>
                  {a.mode === 'analyst'
                    ? 'PARA ANALIZAR TUS NÚMEROS'
                    : 'PODEMOS EMPEZAR POR AQUÍ'}
                </span>
                {documents}
                {SUGGESTIONS[a.mode].map(({ icon: Icon, text }) => (
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
                {m.role === 'user' ? (
                  'Tú'
                ) : (
                  <>
                    {/* La respuesta más reciente muestra el estado "lista"; las anteriores, la marca fija */}
                    {a.latest === m.turnId ? (
                      <MayaClip name="maya-lista" className="maya-mark-message" />
                    ) : (
                      <MayaMark className="maya-mark-message" />
                    )}
                    Maya
                  </>
                )}
              </span>
              {m.role === 'assistant' &&
              m.turnId &&
              a.turns[m.turnId]?.uiSnapshot ? (
                <A2uiRenderer
                  turn={a.turns[m.turnId]}
                  disabled={a.busy}
                  latest={
                    a.latest === m.turnId ||
                    (Boolean(
                      standalone &&
                      ['failed', 'interrupted'].includes(standalone.status),
                    ) &&
                      standalone?.replacesTurnId === m.turnId)
                  }
                  onAction={a.act}
                />
              ) : (
                <p>{m.content}</p>
              )}
            </article>
          ))}
          {standalone && !hasMessage && standalone.uiSnapshot && (
            <article className="chat-message assistant">
              <span className="chat-speaker">
                <MayaClip name="maya-lista" className="maya-mark-message" />
                Maya
              </span>
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
              <MayaClip name="maya-pensando" loop />
              Consultando tu información…
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
        {!welcome && (
          <div className="chat-compose-area">
            {documents}
            {composer}
          </div>
        )}
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
              if (!wide) setHistoryOpen(false);
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
                    if (!wide) setHistoryOpen(false);
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
