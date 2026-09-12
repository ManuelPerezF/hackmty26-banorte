import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createMovement,
  parseAmountCents,
  validDate,
  filterMovements,
  movementTotals,
  OPENING_BALANCE_CENTS,
  decodeMovements,
  encodeMovements,
} from '../src/modules/movimientos/services/movimientos.service.ts';
import { demoMovements } from '../src/modules/movimientos/data/demo-movimientos.ts';
const base = {
  description: 'Café de prueba',
  amount: '0.10',
  type: 'expense' as const,
  category: 'Alimentación',
  date: '2026-09-11',
  notes: 'Reunión',
};
await test('uses integer cents for decimal arithmetic', () => {
  assert.equal(parseAmountCents('0.10') + parseAmountCents('0,20'), 30);
  for (const value of ['0', '-1', '1.001', 'Infinity', 'NaN', '1e3', ''])
    assert.throws(() => parseAmountCents(value));
});
await test('validates calendar dates and future entries', () => {
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('2026-02-29'), false);
  assert.equal(validDate('2026-04-31'), false);
  assert.throws(() =>
    createMovement({ ...base, date: '2026-09-12' }, '2026-09-11'),
  );
  assert.throws(() =>
    createMovement({ ...base, description: '   ' }, '2026-09-11'),
  );
  assert.throws(() =>
    createMovement({ ...base, category: 'Invalid' }, '2026-09-11'),
  );
});
await test('income and expense affect the shared balance with the correct sign', () => {
  const expense = createMovement(base, '2026-09-11');
  const income = createMovement(
    { ...base, type: 'income', amount: '0.20' },
    '2026-09-11',
  );
  assert.equal(
    OPENING_BALANCE_CENTS + movementTotals(demoMovements).net,
    28465000,
  );
  assert.equal(
    movementTotals([...demoMovements, expense, income]).net -
      movementTotals(demoMovements).net,
    10,
  );
});
await test('combines accent-insensitive search with date, type and category filters', () => {
  const result = filterMovements(demoMovements, {
    query: 'cafe',
    type: 'expense',
    category: 'Alimentación',
    from: '2026-09-09',
    to: '2026-09-09',
  });
  assert.deepEqual(
    result.map((item) => item.id),
    ['demo-coffee'],
  );
  assert.equal(
    filterMovements(demoMovements, {
      query: '',
      type: 'all',
      category: '',
      from: '2026-09-10',
      to: '2026-09-01',
    }).length,
    0,
  );
});
await test('round-trips manual records and rejects corrupted or duplicate entries', () => {
  const item = createMovement(base, '2026-09-11');
  assert.deepEqual(decodeMovements(encodeMovements([item])), [item]);
  assert.deepEqual(decodeMovements(null), demoMovements);
  assert.throws(() => decodeMovements('{bad json'));
  assert.throws(() =>
    decodeMovements(JSON.stringify({ version: 2, items: [] })),
  );
  assert.throws(() => decodeMovements(encodeMovements([item, item])));
  assert.throws(() =>
    decodeMovements(encodeMovements([{ ...item, amountCents: -1 }])),
  );
});

await test('persists instrument selection and filters associated movements', () => {
  const card = createMovement(
    { ...base, instrumentId: 'card-oro' },
    '2026-09-11',
  );
  const account = createMovement(
    { ...base, instrumentId: 'account-personal' },
    '2026-09-11',
  );
  const stored = decodeMovements(encodeMovements([card, account]));
  assert.equal(
    stored.find((item) => item.id === card.id)?.instrumentId,
    'card-oro',
  );
  const filtered = filterMovements(stored, {
    query: '',
    type: 'all',
    category: '',
    from: '',
    to: '',
    instrumentId: 'card-oro',
  });
  assert.deepEqual(
    filtered.map((item) => item.id),
    [card.id],
  );
  assert.throws(() =>
    createMovement({ ...base, instrumentId: 'unknown-card' }, '2026-09-11'),
  );
});

await test('preserves legacy history while adding known instrument associations', () => {
  const oldManual = createMovement(base, '2026-09-11');
  delete oldManual.instrumentId;
  const oldSeed = {
    ...demoMovements.find((item) => item.id === 'demo-groceries')!,
  };
  delete oldSeed.instrumentId;
  const restored = decodeMovements(encodeMovements([oldManual, oldSeed]));
  assert.equal(
    restored.find((item) => item.id === oldManual.id)?.instrumentId,
    'account-personal',
  );
  assert.equal(
    restored.find((item) => item.id === oldSeed.id)?.instrumentId,
    'card-clasica',
  );
  assert.equal(
    movementTotals(restored).net,
    movementTotals([oldManual, oldSeed]).net,
  );
});
