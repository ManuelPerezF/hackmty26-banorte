import { instruments, instrumentLabel } from '@/modules/cuentas/data/accounts';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { formatMoney, formatMovementDate } from '@/shared/utils/money';
import { categories } from '../data/demo-movimientos';
import type { useHistorial } from '../hooks/useHistorial';
import { MovimientoDetail } from './movimientoDetail';
export function MovimientosTable({
  history,
  ready,
}: {
  history: ReturnType<typeof useHistorial>;
  ready: boolean;
}) {
  const {
    filters,
    updateFilter,
    clearFilters,
    filtersOpen,
    setFiltersOpen,
    selected,
    setSelectedId,
    filtered,
    visible,
    page,
    setPage,
    pageCount,
    totals,
  } = history;
  const activeFilters = Boolean(
    filters.instrumentId ||
    filters.query ||
    filters.type !== 'all' ||
    filters.category ||
    filters.from ||
    filters.to,
  );
  return (
    <>
      <div className="movement-tools">
        <div className="movement-search">
          <Search size={17} aria-hidden="true" />
          <Input
            aria-label="Buscar movimientos"
            placeholder="Buscar concepto, cuenta o tarjeta"
            value={filters.query}
            onChange={(event) => updateFilter('query', event.target.value)}
          />
          {filters.query && (
            <button
              aria-label="Borrar búsqueda"
              onClick={() => updateFilter('query', '')}
            >
              <X size={15} />
            </button>
          )}
        </div>
        <div className="movement-filter-controls">
          <select
            aria-label="Cuenta o tarjeta"
            value={filters.instrumentId ?? ''}
            onChange={(event) =>
              updateFilter('instrumentId', event.target.value)
            }
          >
            <option value="">Todas las cuentas y tarjetas</option>
            {instruments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Tipo de movimientos"
            value={filters.type}
            onChange={(event) =>
              updateFilter('type', event.target.value as typeof filters.type)
            }
          >
            <option value="all">Todos los movimientos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
          <Button
            variant="ghost"
            className="movement-filter-button"
            aria-expanded={filtersOpen}
            aria-controls="movement-filters"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal size={16} /> Filtros
          </Button>
        </div>
      </div>
      {filtersOpen && (
        <div id="movement-filters" className="movement-filters">
          <div>
            <label htmlFor="filter-category">Categoría</label>
            <select
              id="filter-category"
              value={filters.category}
              onChange={(event) => updateFilter('category', event.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-from">Desde</label>
            <Input
              id="filter-from"
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(event) => updateFilter('from', event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="filter-to">Hasta</label>
            <Input
              id="filter-to"
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(event) => updateFilter('to', event.target.value)}
            />
          </div>
          <Button variant="ghost" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        </div>
      )}
      {filters.from && filters.to && filters.from > filters.to && (
        <p className="movement-error" role="alert">
          La fecha inicial debe ser anterior o igual a la final.
        </p>
      )}
      <div className="movement-summary">
        <span>
          <i className="summary-dot income" />
          Ingresos <strong>{formatMoney(totals.income)}</strong>
        </span>
        <span>
          <i className="summary-dot expense" />
          Gastos <strong>{formatMoney(totals.expense)}</strong>
        </span>
        <span className="movement-result-count" aria-live="polite">
          {filtered.length}{' '}
          {filtered.length === 1 ? 'movimiento' : 'movimientos'}
          {activeFilters ? ' · Filtrados' : ''}
        </span>
      </div>
      <div
        className={`movement-history-layout ${selected ? 'has-detail' : ''}`}
      >
        <div className="movement-table-area">
          {!ready ? (
            <p className="movement-empty">Cargando tu historial…</p>
          ) : filtered.length ? (
            <div className="movement-table-scroll">
              <table className="movements-table">
                <caption className="sr-only">
                  Historial de ingresos y gastos. Selecciona un concepto para
                  ver su detalle.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Concepto</th>
                    <th scope="col" className="movement-category-col">
                      Categoría
                    </th>
                    <th scope="col" className="movement-instrument-col">
                      Cuenta / tarjeta
                    </th>
                    <th scope="col" className="movement-date-col">
                      Fecha
                    </th>
                    <th scope="col" className="movement-amount-col">
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => (
                    <tr
                      key={item.id}
                      className={selected?.id === item.id ? 'is-selected' : ''}
                    >
                      <td>
                        <button
                          id={`movement-${item.id}`}
                          className="movement-open"
                          onClick={() =>
                            setSelectedId(
                              selected?.id === item.id ? null : item.id,
                            )
                          }
                          aria-expanded={selected?.id === item.id}
                          aria-controls={
                            selected?.id === item.id
                              ? 'movement-detail'
                              : undefined
                          }
                          aria-label={`Ver detalle de ${item.description}`}
                        >
                          <span className={`movement-avatar ${item.type}`}>
                            {item.type === 'income' ? (
                              <ArrowDownLeft size={18} />
                            ) : (
                              <ArrowUpRight size={18} />
                            )}
                          </span>
                          <span>
                            <strong>{item.description}</strong>
                            <small>
                              {item.type === 'income' ? 'Ingreso' : 'Gasto'} ·{' '}
                              {instrumentLabel(item.instrumentId)}
                              <span className="movement-mobile-date">
                                {' '}
                                · {formatMovementDate(item.date)}
                              </span>
                            </small>
                          </span>
                        </button>
                      </td>
                      <td className="movement-category-col">
                        <span className="movement-category">
                          {item.category}
                        </span>
                      </td>
                      <td className="movement-instrument-col">
                        <span className="movement-instrument-label">
                          {instrumentLabel(item.instrumentId)}
                        </span>
                      </td>
                      <td className="movement-date-col">
                        {formatMovementDate(item.date)}
                      </td>
                      <td className={`movement-amount-col ${item.type}`}>
                        {item.type === 'income' ? '+' : '−'}
                        {formatMoney(item.amountCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="movement-empty">
              <Search size={26} strokeWidth={1.5} />
              <h3>No encontramos movimientos.</h3>
              <p>Prueba otro concepto o ajusta los filtros.</p>
              {activeFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  Limpiar búsqueda y filtros
                </Button>
              )}
            </div>
          )}
          <div className="movement-pagination">
            <span>Ordenados del más reciente al más antiguo</span>
            <div>
              <Button
                variant="ghost"
                aria-label="Página anterior"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={17} />
              </Button>
              <span>
                {page} / {pageCount}
              </span>
              <Button
                variant="ghost"
                aria-label="Página siguiente"
                disabled={page >= pageCount}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight size={17} />
              </Button>
            </div>
          </div>
        </div>
        {selected && (
          <MovimientoDetail
            movement={selected}
            onClose={() => {
              setSelectedId(null);
              document.getElementById(`movement-${selected.id}`)?.focus();
            }}
          />
        )}
      </div>
    </>
  );
}
