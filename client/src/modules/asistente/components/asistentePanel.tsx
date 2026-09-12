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

import type { getMovementInsights } from '../services/asistente.service';
import { formatMoney } from '@/shared/utils/money';
export function AsistentePanel({
  scenario,
  draft,
  setDraft,
  activityOpen,
  setActivityOpen,
  lastPrompt,
  choosePrompt,
  submitPrompt,
  insights,
}: ReturnType<typeof useAsistente> & {
  insights: ReturnType<typeof getMovementInsights>;
}) {
  const { totals, spending } = insights;
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
              <Link2 size={13} /> Análisis de movimientos
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
                    Claro. Organicé tu historial de movimientos para que veas{' '}
                    <strong>a dónde va tu dinero.</strong>
                  </>
                ) : (
                  <>
                    Preparé una vista de{' '}
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
                <p>Todo tu historial · MXN</p>
                <div className="insight-total">
                  {formatMoney(
                    scenario === 'expenses' ? totals.expense : totals.net,
                  )}
                </div>
                {scenario === 'expenses' ? (
                  <div className="spending-bars">
                    {spending.map((item, i) => (
                      <div className="spending-row" key={item.name}>
                        <div>
                          <span>{item.name}</span>
                          <strong>{formatMoney(item.amount)}</strong>
                        </div>
                        <span className="spending-track">
                          <span
                            style={{
                              width: `${item.width}%`,
                              opacity: Math.max(0.3, 1 - i * 0.1),
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
                      <strong>{formatMoney(totals.income)}</strong>
                      <i style={{ width: `${insights.incomeWidth}%` }} />
                    </div>
                    <div>
                      <span>Gastos</span>
                      <strong>{formatMoney(totals.expense)}</strong>
                      <i style={{ width: `${insights.expenseWidth}%` }} />
                    </div>
                    <p>
                      <TrendingUp size={15} /> Balance neto:{' '}
                      {formatMoney(totals.net)}.
                    </p>
                  </div>
                )}
                <div className="insight-footer">
                  <Database size={12} /> Movimientos de la cuenta ••4281
                </div>
              </section>
              <p className="assistant-takeaway">
                {scenario === 'expenses' ? (
                  spending[0] ? (
                    <>
                      {spending[0].name} representa el{' '}
                      <strong>{spending[0].share}% de tus gastos</strong> en
                      este historial.
                    </>
                  ) : (
                    'Todavía no hay gastos registrados.'
                  )
                ) : (
                  <>
                    La diferencia entre ingresos y gastos es{' '}
                    <strong>{formatMoney(totals.net)}</strong> en este
                    historial.
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
                Mensaje al asistente
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
                aria-label="Enviar mensaje"
                disabled={!draft.trim()}
              >
                <ArrowUp size={17} />
              </Button>
            </form>
            <p>Explora tus gastos y encuentra oportunidades de ahorro.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
