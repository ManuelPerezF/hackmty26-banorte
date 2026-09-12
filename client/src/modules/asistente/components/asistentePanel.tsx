'use client';
import type { useAsistente } from '../hooks/useAsistente';
import {
  ArrowUp,
  Check,
  ChevronDown,
  Command,
  Database,
  LayoutDashboard,
  Link2,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

import { ViewTransition } from '@/shared/components/view-transition';

import { spending } from '../data/demo-spending';
export function AsistentePanel({
  scenario,
  draft,
  setDraft,
  activityOpen,
  setActivityOpen,
  lastPrompt,
  choosePrompt,
  submitPrompt,
}: ReturnType<typeof useAsistente>) {
  return (
    <div className="finance-workspace chat-page">
      <div className="finance-assistant-sheet finance-embedded-chat">
        <aside className="assistant-panel" aria-labelledby="assistant-title">
          <header className="assistant-header">
            <span className="assistant-avatar">
              <Command size={22} strokeWidth={1.7} />
            </span>
            <div>
              <h3 id="assistant-title">Asistente Banorte</h3>
              <span>Una nueva forma de hacer banca</span>
            </div>
            <span className="ai-pill">IA</span>
          </header>
          <div className="assistant-context">
            <span>
              <Link2 size={13} /> MCP simulado
            </span>
            <span>
              <span className="context-dot" /> 3 herramientas
            </span>
          </div>
          <div className="conversation">
            <div className="conversation-date">
              Tu dinero, en una conversación
            </div>
            <div className="user-message">{lastPrompt}</div>
            <ViewTransition
              stateKey={scenario + lastPrompt}
              className="assistant-response"
            >
              <div className="response-label">
                <Command size={14} /> ASISTENTE BANORTE
              </div>
              <p>
                {scenario === 'expenses' ? (
                  <>
                    Claro. Organicé tus movimientos de septiembre para que veas{' '}
                    <strong>a dónde va tu dinero.</strong>
                  </>
                ) : (
                  <>
                    Tus ingresos superan tus gastos. Preparé una vista de{' '}
                    <strong>lo que entra y lo que sale.</strong>
                  </>
                )}
              </p>
              <div className="tool-activity">
                <Button
                  variant="ghost"
                  aria-expanded={activityOpen}
                  onClick={() => setActivityOpen(!activityOpen)}
                >
                  <span className="activity-check">
                    <Check size={12} />
                  </span>
                  <span>3 herramientas consultadas</span>
                  <ChevronDown
                    size={14}
                    className={activityOpen ? 'is-open' : ''}
                  />
                </Button>
                {activityOpen && (
                  <ol>
                    <li>
                      <Database size={13} />
                      <span>
                        Consultar cuentas<code>accounts.get_summary</code>
                      </span>
                      <Check size={12} />
                    </li>
                    <li>
                      <Receipt size={13} />
                      <span>
                        Leer movimientos<code>transactions.list</code>
                      </span>
                      <Check size={12} />
                    </li>
                    <li>
                      <LayoutDashboard size={13} />
                      <span>
                        Generar interfaz<code>ui.render_insight</code>
                      </span>
                      <Check size={12} />
                    </li>
                  </ol>
                )}
              </div>
              <section
                className="generated-insight"
                aria-label="Interfaz generada de ejemplo"
              >
                <div className="insight-label">
                  <LayoutDashboard size={13} />
                  <span>VISTA GENERADA</span>
                  <span>01</span>
                </div>
                <h4>
                  {scenario === 'expenses'
                    ? 'Así se distribuyen tus gastos'
                    : 'Tu flujo de efectivo'}
                </h4>
                <p>01 — 09 sept 2026 · MXN</p>
                <div className="insight-total">
                  {scenario === 'expenses' ? '$48,350' : '+ $38,050'}
                  <span>.00</span>
                </div>
                {scenario === 'expenses' ? (
                  <div className="spending-bars">
                    {spending.map((item, i) => (
                      <div className="spending-row" key={item.name}>
                        <div>
                          <span>{item.name}</span>
                          <strong>{item.value}</strong>
                        </div>
                        <span className="spending-track">
                          <span
                            style={{
                              width: `${item.width}%`,
                              opacity: 1 - i * 0.17,
                            }}
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="cashflow-insight">
                    <div>
                      <span>Ingresos</span>
                      <strong>$86,400</strong>
                      <i style={{ width: '100%' }} />
                    </div>
                    <div>
                      <span>Gastos</span>
                      <strong>$48,350</strong>
                      <i style={{ width: '56%' }} />
                    </div>
                    <p>
                      <TrendingUp size={15} /> El 44% de tus ingresos permanece
                      disponible.
                    </p>
                  </div>
                )}
                <div className="insight-footer">
                  <Database size={12} /> Movimientos de la cuenta ••4281
                </div>
              </section>
              <p className="assistant-takeaway">
                {scenario === 'expenses' ? (
                  <>
                    La vivienda representa el <strong>38% de tus gastos</strong>
                    . Es tu categoría principal este mes.
                  </>
                ) : (
                  <>
                    Tus ingresos superan tus gastos en <strong>$38,050</strong>{' '}
                    durante este periodo.
                  </>
                )}
              </p>
            </ViewTransition>
          </div>
          <div className="assistant-compose">
            <div className="prompt-suggestions">
              <Button
                variant="ghost"
                onClick={() =>
                  choosePrompt('cashflow', 'Muéstrame mi flujo de efectivo.')
                }
              >
                <TrendingUp size={13} /> Ver flujo de efectivo
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  choosePrompt('expenses', '¿En qué gasté este mes?')
                }
              >
                <Receipt size={13} /> Analizar gastos
              </Button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitPrompt();
              }}
            >
              <label className="sr-only" htmlFor="assistant-prompt">
                Mensaje de prueba al asistente
              </label>
              <Input
                id="assistant-prompt"
                placeholder="¿Qué quieres entender de tu dinero?"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={160}
              />
              <Button
                type="submit"
                aria-label="Enviar mensaje de prueba"
                disabled={!draft.trim()}
              >
                <ArrowUp size={17} />
              </Button>
            </form>
            <p>Demostración visual · Sin conexión bancaria real</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
