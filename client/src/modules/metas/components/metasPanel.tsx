'use client';
import { Flag, Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import type { useMetas } from '../hooks/useMetas';
import '../styles/metas.css';
const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
});
export function MetasPanel({
  goals,
  addGoal,
  error,
  notice,
}: ReturnType<typeof useMetas>) {
  return (
    <section className="goals-view" aria-labelledby="goals-title">
      <div className="goals-intro">
        <h2 id="goals-title">Dale un destino a tu ahorro.</h2>
        <p>
          Un viaje, un imprevisto o eso que llevas tiempo planeando. Empieza con
          un nombre y una cantidad.
        </p>
      </div>
      <form
        className="goal-form"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          const name = data.get('name');
          if (
            addGoal({
              name: typeof name === 'string' ? name : '',
              target: Number(data.get('target')),
            })
          )
            form.reset();
        }}
      >
        <div>
          <label htmlFor="goal-name">¿Para qué quieres ahorrar?</label>
          <Input
            id="goal-name"
            name="name"
            placeholder="Mi fondo de emergencia"
            maxLength={60}
            required
          />
        </div>
        <div>
          <label htmlFor="goal-target">Monto objetivo (MXN)</label>
          <Input
            id="goal-target"
            name="target"
            type="number"
            inputMode="decimal"
            min="1"
            max="1000000000"
            step="0.01"
            placeholder="10000"
            required
          />
        </div>
        <Button type="submit" className="button">
          <Plus size={17} /> Crear meta
        </Button>
      </form>
      {error && (
        <p className="goal-error" role="alert">
          {error}
        </p>
      )}
      <output className="goal-notice" aria-live="polite">
        {notice}
      </output>
      <div className="goals-heading">
        <h3>Mis metas</h3>
        <span>
          {goals.length} {goals.length === 1 ? 'meta' : 'metas'}
        </span>
      </div>
      {goals.length ? (
        <ul className="goals-list">
          {goals.map((goal) => (
            <li key={goal.id}>
              <span className="goal-symbol">
                <Flag size={21} aria-hidden="true" />
              </span>
              <div>
                <h4>{goal.name}</h4>
                <p>Objetivo de ahorro · Sin aportaciones</p>
              </div>
              <strong>{money.format(goal.target)}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <div className="goals-empty">
          <Flag size={28} strokeWidth={1.5} aria-hidden="true" />
          <h4>Tu primera meta empieza aquí.</h4>
          <p>Cuando crees una meta, aparecerá en este espacio.</p>
        </div>
      )}
      <p className="goals-note">
        Los objetivos se conservan mientras permaneces en el panel. Crear una
        meta en esta demo no aparta ni mueve dinero.
      </p>
    </section>
  );
}
