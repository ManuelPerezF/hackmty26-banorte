import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAmountCents,
  validDate,
  filterMovements,
  movementTotals,
} from '../src/modules/movimientos/services/movimientos.service.ts';
import type { Movement } from '../src/modules/movimientos/types/movimientos.types';
const row: Movement = {
  id: 'movement-test',
  description: 'Café capturado',
  amountCents: 10,
  type: 'expense',
  category: 'Alimentación',
  date: '2026-09-11',
  notes: '',
  createdAt: 1,
  source: 'manual',
  instrumentId: 'account-test',
  account: { id: 'account-test', name: 'Cuenta propia', currency: 'MXN' },
};
const filters = {
  query: '',
  type: 'all' as const,
  category: '',
  from: '',
  to: '',
};
await test('uses integer cents for decimal arithmetic', () => {
  assert.equal(parseAmountCents('0.10') + parseAmountCents('0,20'), 30);
  for (const value of ['0', '-1', '1.001', 'Infinity', 'NaN', '1e3', ''])
    assert.throws(() => parseAmountCents(value));
});
await test('validates real calendar dates', () => {
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('2026-02-29'), false);
  assert.equal(validDate('2026-04-31'), false);
});
await test('empty history stays empty and has no synthetic opening balance', () => {
  assert.deepEqual(movementTotals([]), { income: 0, expense: 0, net: 0 });
  assert.deepEqual(filterMovements([], filters), []);
  assert.equal(
    movementTotals([
      row,
      { ...row, id: 'income', type: 'income', amountCents: 20 },
    ]).net,
    10,
  );
});
await test('combines accent-insensitive search, date, type and category', () => {
  assert.equal(
    filterMovements([row], {
      ...filters,
      query: 'cafe',
      type: 'expense',
      category: 'Alimentación',
      from: '2026-09-11',
      to: '2026-09-11',
    }).length,
    1,
  );
  assert.equal(
    filterMovements([row], { ...filters, from: '2026-09-12' }).length,
    0,
  );
});
await test('searches persisted account/card information without fixture IDs', () => {
  const card: Movement = {
    ...row,
    id: 'card-movement',
    instrumentId: 'actual-card-id',
    card: {
      id: 'actual-card-id',
      last4: '5678',
      product: { key: 'oro', name: 'Oro', imageKey: 'oro' },
    },
  };
  assert.deepEqual(
    filterMovements([row, card], {
      ...filters,
      instrumentId: 'actual-card-id',
    }),
    [card],
  );
  assert.deepEqual(
    filterMovements([row, card], { ...filters, query: '5678' }),
    [card],
  );
  assert.deepEqual(
    filterMovements([row], { ...filters, query: 'cuenta propia' }),
    [row],
  );
});
