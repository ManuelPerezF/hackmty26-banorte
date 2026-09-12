import assert from 'node:assert/strict';
import test from 'node:test';
import {
  turnSchema,
  decodeSurface,
  dataAt,
  catalogId,
} from '../src/modules/asistente/types/protocol.ts';
const snapshot = () => ({
  id: 'turn-1',
  conversationId: 'conversation-1',
  revision: 1,
  status: 'completed',
  assistantMessage: 'Tus gastos',
  pendingActions: [],
  error: null,
  uiSnapshot: [
    { version: 'v0.9.1', createSurface: { surfaceId: 'turn-1', catalogId } },
    {
      version: 'v0.9.1',
      updateComponents: {
        surfaceId: 'turn-1',
        components: [
          { id: 'root', component: 'Column', children: ['summary'] },
          {
            id: 'summary',
            component: 'BanorteBalance',
            data: { path: '/balance' },
          },
        ],
      },
    },
    {
      version: 'v0.9.1',
      updateDataModel: {
        surfaceId: 'turn-1',
        path: '/',
        value: { balance: { balanceCents: 12345 } },
      },
    },
  ],
});
void test('reconstructs an allowed surface and resolves its financial data', () => {
  const result = decodeSurface(turnSchema.parse(snapshot()));
  assert.equal(result.components[0].component, 'BanorteBalance');
  assert.deepEqual(dataAt(result.data, '/balance'), { balanceCents: 12345 });
});
void test('rejects unknown model components, protocol versions and catalogs', () => {
  for (const mutate of [
    (s: ReturnType<typeof snapshot>) => {
      s.uiSnapshot[1].updateComponents!.components[1].component = 'script';
    },
    (s: ReturnType<typeof snapshot>) => {
      s.uiSnapshot[0].version = 'v99';
    },
    (s: ReturnType<typeof snapshot>) => {
      s.uiSnapshot[0].createSurface!.catalogId = 'untrusted';
    },
  ]) {
    const s = snapshot();
    mutate(s);
    assert.equal(turnSchema.safeParse(s).success, false);
  }
});
void test('rejects references to another turn and duplicate or missing components', () => {
  const foreign = snapshot();
  foreign.uiSnapshot[1].updateComponents!.surfaceId = 'another-turn';
  assert.throws(() => decodeSurface(turnSchema.parse(foreign)));
  const duplicate = snapshot();
  duplicate.uiSnapshot[1].updateComponents!.components.push(
    duplicate.uiSnapshot[1].updateComponents!.components[1],
  );
  assert.throws(() => decodeSurface(turnSchema.parse(duplicate)));
  const missing = snapshot();
  missing.uiSnapshot[1].updateComponents!.components[0].children = ['missing'];
  assert.throws(() => decodeSurface(turnSchema.parse(missing)));
});
void test('data references cannot traverse prototypes', () => {
  assert.equal(dataAt({}, '/__proto__'), undefined);
  assert.equal(dataAt({}, '/constructor/prototype'), undefined);
  assert.equal(dataAt({ a: null }, '/a/b'), undefined);
});

void test('accepts RAG and adaptive components across stored snapshots', async () => {
  const { parseTurn } =
    await import('../src/modules/asistente/types/protocol.ts');
  for (const name of [
    'BanorteSources',
    'BanortePeriodComparison',
    'BanorteKnowledgeFacts',
    'BanorteGoalConfirmation',
  ]) {
    const s = snapshot();
    s.uiSnapshot[1].updateComponents!.components[1].component = name;
    assert.equal(decodeSurface(parseTurn(s)).components[0].component, name);
  }
});
void test('reports incompatible snapshots without exposing validation JSON', async () => {
  const { parseTurn, UiCompatibilityError } =
    await import('../src/modules/asistente/types/protocol.ts');
  const s = snapshot();
  s.uiSnapshot[1].updateComponents!.components[1].component = 'UnknownBlock';
  assert.throws(
    () => parseTurn(s),
    (e: unknown) =>
      e instanceof UiCompatibilityError &&
      e.message.includes('Actualiza la página') &&
      !e.message.includes('invalid_union'),
  );
});
void test('checks actual catalog capabilities, not only its identifier', async () => {
  const { assertCatalog, supportedComponents } =
    await import('../src/modules/asistente/types/protocol.ts');
  assert.doesNotThrow(() =>
    assertCatalog({
      catalogId,
      components: Object.fromEntries(supportedComponents.map((n) => [n, {}])),
    }),
  );
  assert.throws(() =>
    assertCatalog({ catalogId, components: { UnknownBlock: {} } }),
  );
  assert.throws(() => assertCatalog({ catalogId }));
});
