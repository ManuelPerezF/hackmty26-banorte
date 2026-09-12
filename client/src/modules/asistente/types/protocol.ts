import { z } from 'zod';
export const catalogId = 'urn:banorte:a2ui:catalog:1';
const component = z.discriminatedUnion('component', [
  z.object({
    id: z.string(),
    component: z.literal('Column'),
    children: z.array(z.string()),
  }),
  z.object({
    id: z.string(),
    component: z.literal('Text'),
    text: z.string(),
    variant: z.enum(['h2', 'body']),
  }),
  z.object({
    id: z.string(),
    component: z.enum([
      'BanorteBalance',
      'BanorteMovementTable',
      'BanorteSpendingChart',
      'BanorteMovementForm',
      'BanorteConfirmation',
      'BanorteActionResult',
      'BanortePeriodSelector',
    ]),
    data: z.object({ path: z.string().regex(/^\//) }),
    action: z.string().optional(),
  }),
]);
const envelope = z.union([
  z.object({
    version: z.literal('v0.9.1'),
    createSurface: z.object({
      surfaceId: z.string(),
      catalogId: z.literal(catalogId),
    }),
  }),
  z.object({
    version: z.literal('v0.9.1'),
    updateComponents: z.object({
      surfaceId: z.string(),
      components: z.array(component),
    }),
  }),
  z.object({
    version: z.literal('v0.9.1'),
    updateDataModel: z.object({
      surfaceId: z.string(),
      path: z.literal('/'),
      value: z.record(z.string(), z.unknown()),
    }),
  }),
]);
export const turnSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  status: z.enum(['queued', 'running', 'completed', 'failed', 'interrupted']),
  revision: z.number(),
  assistantMessage: z.string(),
  uiSnapshot: z.array(envelope).nullable(),
  pendingActions: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      expiresAt: z.number(),
      result: z.unknown().optional(),
    }),
  ),
  error: z.object({ code: z.string(), message: z.string() }).nullable(),
});
export type Turn = z.infer<typeof turnSchema>;
export type ChatMessage = {
  id: string;
  role: string;
  content: string;
  turnId: string | null;
  createdAt: number;
};
export type Conversation = { id: string; title: string; createdAt: number };
export type UiAction = {
  event: string;
  surfaceId: string;
  revision: number;
  values?: unknown;
  actionId?: string;
};
export type Component = z.infer<typeof component>;
export function decodeSurface(turn: Turn) {
  let id = '';
  const components: Component[] = [];
  let data: Record<string, unknown> = {};
  for (const message of turn.uiSnapshot ?? []) {
    if ('createSurface' in message) {
      id = message.createSurface.surfaceId;
      if (id !== turn.id) throw new Error('Superficie inválida');
    } else if ('updateComponents' in message) {
      if (message.updateComponents.surfaceId !== id)
        throw new Error('Superficie inválida');
      components.push(...message.updateComponents.components);
    } else {
      if (message.updateDataModel.surfaceId !== id)
        throw new Error('Superficie inválida');
      data = message.updateDataModel.value;
    }
  }
  const ids = components.map((c) => c.id);
  if (new Set(ids).size !== ids.length)
    throw new Error('Componentes duplicados');
  const root = components.find((c) => c.id === 'root');
  if (root?.component !== 'Column') throw new Error('Raíz inválida');
  return {
    components: root.children.map((id) => {
      const c = components.find((c) => c.id === id);
      if (!c || c.component === 'Column')
        throw new Error('Componente inválido');
      return c;
    }),
    data,
  };
}
export function dataAt(data: Record<string, unknown>, path: string): unknown {
  let value: unknown = data;
  for (const key of path.slice(1).split('/')) {
    if (
      !value ||
      typeof value !== 'object' ||
      ['__proto__', 'prototype', 'constructor'].includes(key)
    )
      return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}
