'use client';
import { useState } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { MovimientosTable } from '../components/movimientosTable';
import { MovimientoForm } from '../components/movimientoForm';
import { useHistorial } from '../hooks/useHistorial';
import type { useMovimientos } from '../hooks/useMovimientos';
import '../styles/movimientos.css';
export function Movimientos({
  ledger,
  initialInstrument = '',
}: {
  ledger: ReturnType<typeof useMovimientos>;
  initialInstrument?: string;
}) {
  const [view, setView] = useState<'history' | 'register'>('history');
  const history = useHistorial(ledger.movements, initialInstrument);
  const openRegistration = () => {
    ledger.clearError();
    setView('register');
  };
  return (
    <section className="movements-view">
      <div className="movement-nav">
        <nav aria-label="Vistas de movimientos">
          <button
            aria-current={view === 'history' ? 'page' : undefined}
            onClick={() => setView('history')}
          >
            Historial
          </button>
          <button
            aria-current={view === 'register' ? 'page' : undefined}
            onClick={openRegistration}
          >
            Registrar
          </button>
        </nav>
        {view === 'history' && (
          <Button
            className="button movement-primary"
            disabled={!ledger.ready}
            onClick={openRegistration}
          >
            <Plus size={17} /> Registrar movimiento
          </Button>
        )}
      </div>
      {view === 'history' ? (
        <>
          <div className="movement-heading">
            <h2>Tu historial</h2>
            <p>Consulta tus ingresos y gastos por cuenta o tarjeta.</p>
          </div>
          {ledger.notice && (
            <output className="movement-success" aria-live="polite">
              <CheckCircle2 size={17} />
              {ledger.notice}
            </output>
          )}
          {ledger.error && (
            <p className="movement-error" role="alert">
              {ledger.error}
            </p>
          )}
          <MovimientosTable history={history} ready={ledger.ready} />
          <p className="movement-disclosure">
            Importes en pesos mexicanos (MXN).
          </p>
        </>
      ) : (
        <MovimientoForm
          initialInstrument={initialInstrument}
          ready={ledger.ready}
          error={ledger.error}
          onCancel={() => {
            ledger.clearError();
            setView('history');
          }}
          onRegister={(input) => {
            if (!ledger.registerMovement(input)) return false;
            history.clearFilters();
            setView('history');
            return true;
          }}
        />
      )}
    </section>
  );
}
