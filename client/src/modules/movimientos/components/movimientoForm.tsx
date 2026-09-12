'use client';
import {
  useBank,
  useInstruments,
} from '@/modules/cuentas/context/bank-context';
import { useId, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Check, ShieldCheck } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { categories } from '../data/categories';
import { localDateKey } from '../services/movimientos.service';
import type { MovementInput, MovementType } from '../types/movimientos.types';
export function MovimientoForm({
  initialInstrument = '',
  onRegister,
  onCancel,
  ready,
  error,
}: {
  initialInstrument?: string;
  onRegister: (input: MovementInput) => Promise<boolean>;
  onCancel: () => void;
  ready: boolean;
  error: string;
}) {
  const fieldId = useId();
  const instruments = useInstruments();
  const { account: personalAccount } = useBank();
  const [type, setType] = useState<MovementType>('expense');
  return (
    <div className="movement-create-layout">
      <section
        className="movement-form-main"
        aria-labelledby={`${fieldId}-register-title`}
      >
        <h2 id={`${fieldId}-register-title`}>Registrar movimiento</h2>
        <p>Añade un ingreso o gasto para llevar tus cuentas al día.</p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const text = (name: string) => {
              const value = data.get(name);
              return typeof value === 'string' ? value : '';
            };
            await onRegister({
              instrumentId: text('instrumentId'),
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
                disabled={!ready}
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
                disabled={!ready}
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
            <label htmlFor={`${fieldId}-movement-amount`}>Monto</label>
            <div className="movement-amount-field">
              <span aria-hidden="true">$</span>
              <Input
                disabled={!ready}
                id={`${fieldId}-movement-amount`}
                name="amount"
                inputMode="decimal"
                placeholder="0.00"
                required
                maxLength={12}
                autoComplete="off"
                aria-describedby={`${fieldId}-amount-currency`}
              />
              <span id={`${fieldId}-amount-currency`}>MXN</span>
            </div>
          </div>
          <div className="movement-field">
            <label htmlFor={`${fieldId}-movement-instrument`}>
              {type === 'income'
                ? 'Cuenta o tarjeta de destino'
                : 'Cuenta o tarjeta utilizada'}
            </label>
            <select
              disabled={!ready}
              id={`${fieldId}-movement-instrument`}
              name="instrumentId"
              defaultValue={initialInstrument || personalAccount.id}
              required
            >
              {instruments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="movement-field">
            <label htmlFor={`${fieldId}-movement-description`}>Concepto</label>
            <Input
              disabled={!ready}
              id={`${fieldId}-movement-description`}
              name="description"
              placeholder="Ej. Supermercado, nómina, renta"
              required
              maxLength={80}
            />
          </div>
          <div className="movement-form-row">
            <div className="movement-field">
              <label htmlFor={`${fieldId}-movement-category`}>Categoría</label>
              <select
                disabled={!ready}
                id={`${fieldId}-movement-category`}
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
              <label htmlFor={`${fieldId}-movement-date`}>Fecha</label>
              <Input
                disabled={!ready}
                id={`${fieldId}-movement-date`}
                name="date"
                type="date"
                required
                defaultValue={localDateKey()}
                max={localDateKey()}
              />
            </div>
          </div>
          <div className="movement-field">
            <label htmlFor={`${fieldId}-movement-notes`}>
              Nota <span>Opcional</span>
            </label>
            <textarea
              disabled={!ready}
              id={`${fieldId}-movement-notes`}
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
            <Button
              type="button"
              variant="ghost"
              disabled={!ready}
              onClick={onCancel}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </section>
      <aside className="movement-form-guide">
        <ShieldCheck size={26} strokeWidth={1.5} />
        <h3>Tus cuentas, más claras.</h3>
        <p>
          El movimiento aparecerá en tu historial con la cuenta o tarjeta que
          selecciones.
        </p>
        <ul>
          <li>Ingreso: suma al saldo.</li>
          <li>Gasto: resta del saldo.</li>
          <li>Identifica dónde recibiste o utilizaste tu dinero.</li>
        </ul>
        <p className="movement-disclosure">
          Este registro manual no realiza pagos ni transferencias bancarias.
        </p>
      </aside>
    </div>
  );
}
