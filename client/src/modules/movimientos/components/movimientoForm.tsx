'use client';
import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Check, ShieldCheck } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { categories } from '../data/demo-movimientos';
import { localDateKey } from '../services/movimientos.service';
import type { MovementInput, MovementType } from '../types/movimientos.types';
export function MovimientoForm({
  onRegister,
  onCancel,
  ready,
  error,
}: {
  onRegister: (input: MovementInput) => boolean;
  onCancel: () => void;
  ready: boolean;
  error: string;
}) {
  const [type, setType] = useState<MovementType>('expense');
  return (
    <div className="movement-create-layout">
      <section className="movement-form-main" aria-labelledby="register-title">
        <h2 id="register-title">Registrar movimiento</h2>
        <p>Añade un ingreso o gasto para llevar tus cuentas al día.</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const text = (name: string) => {
              const value = data.get(name);
              return typeof value === 'string' ? value : '';
            };
            onRegister({
              type,
              description: text('description'),
              amount: text('amount'),
              category: text('category'),
              date: text('date'),
              notes: text('notes'),
            });
          }}
        >
          <fieldset className="movement-type-picker">
            <legend>Tipo de movimiento</legend>
            <label className={type === 'expense' ? 'is-selected' : ''}>
              <input
                type="radio"
                name="type"
                value="expense"
                checked={type === 'expense'}
                onChange={() => setType('expense')}
              />
              <ArrowUpRight size={18} />
              <span>Gasto</span>
            </label>
            <label className={type === 'income' ? 'is-selected' : ''}>
              <input
                type="radio"
                name="type"
                value="income"
                checked={type === 'income'}
                onChange={() => setType('income')}
              />
              <ArrowDownLeft size={18} />
              <span>Ingreso</span>
            </label>
          </fieldset>
          <div className="movement-field">
            <label htmlFor="movement-amount">Monto</label>
            <div className="movement-amount-field">
              <span aria-hidden="true">$</span>
              <Input
                id="movement-amount"
                name="amount"
                inputMode="decimal"
                placeholder="0.00"
                required
                maxLength={12}
                autoComplete="off"
                aria-describedby="amount-currency"
              />
              <span id="amount-currency">MXN</span>
            </div>
          </div>
          <div className="movement-field">
            <label htmlFor="movement-description">Concepto</label>
            <Input
              id="movement-description"
              name="description"
              placeholder="Ej. Supermercado, nómina, renta"
              required
              maxLength={80}
            />
          </div>
          <div className="movement-form-row">
            <div className="movement-field">
              <label htmlFor="movement-category">Categoría</label>
              <select
                id="movement-category"
                name="category"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Seleccionar categoría
                </option>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="movement-field">
              <label htmlFor="movement-date">Fecha</label>
              <Input
                id="movement-date"
                name="date"
                type="date"
                required
                defaultValue={localDateKey()}
                max={localDateKey()}
              />
            </div>
          </div>
          <div className="movement-field">
            <label htmlFor="movement-notes">
              Nota <span>Opcional</span>
            </label>
            <textarea
              id="movement-notes"
              name="notes"
              placeholder="Un detalle que quieras recordar…"
              maxLength={500}
              rows={3}
            />
          </div>
          {error && (
            <p className="movement-error" role="alert">
              {error}
            </p>
          )}
          <div className="movement-form-actions">
            <Button type="submit" className="button" disabled={!ready}>
              <Check size={17} /> Guardar movimiento
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </section>
      <aside className="movement-form-guide">
        <ShieldCheck size={26} strokeWidth={1.5} />
        <h3>Tus cuentas, más claras.</h3>
        <p>
          El movimiento aparecerá en tu historial y se reflejará en el saldo de
          demostración.
        </p>
        <ul>
          <li>Ingreso: suma al saldo.</li>
          <li>Gasto: resta del saldo.</li>
          <li>Guardado en este navegador.</li>
        </ul>
        <p className="movement-disclosure">
          Este registro manual no realiza pagos ni transferencias bancarias.
        </p>
      </aside>
    </div>
  );
}
