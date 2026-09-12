import { test } from 'node:test';
import assert from 'node:assert/strict';
import { goalPlan } from '../src/modules/metas/services/goal-plan.ts';
await test('goal planning requires an amount and a valid deadline', () => {
  assert.equal(goalPlan(1200000, null, '2026-09-12'), null);
  assert.equal(goalPlan(0, '2027-09-12', '2026-09-12'), null);
  assert.equal(goalPlan(1200000, '2027-02-30', '2026-09-12'), null);
});
await test('monthly reference covers the target without losing cents', () => {
  const p = goalPlan(10000, '2026-12-12', '2026-09-12')!;
  assert.equal(p.months, 3);
  assert.equal(p.monthlyCents, 3334);
  assert.ok(p.monthlyCents! * p.months >= 10000);
});
await test('partial months round up across calendar and leap-year boundaries', () => {
  assert.equal(goalPlan(1200000, '2027-09-12', '2026-09-12')?.months, 12);
  assert.equal(goalPlan(1200000, '2027-09-13', '2026-09-12')?.months, 13);
  assert.equal(goalPlan(1200000, '2028-02-29', '2028-01-31')?.months, 1);
  assert.equal(goalPlan(10000, '2026-09-13', '2026-09-12')?.months, 1);
});
await test('expired and today deadlines do not suggest a monthly schedule', () => {
  assert.equal(goalPlan(10000, '2026-09-11', '2026-09-12')?.status, 'overdue');
  assert.equal(goalPlan(10000, '2026-09-12', '2026-09-12')?.status, 'today');
  assert.equal(goalPlan(10000, '2026-09-12', '2026-09-12')?.monthlyCents, null);
});
