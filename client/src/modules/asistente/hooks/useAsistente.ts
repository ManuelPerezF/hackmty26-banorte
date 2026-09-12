import { useCallback, useEffect, useRef, useState } from 'react';
import {
  api,
  allPages,
  API_BASE,
  mutationKey,
  type KeyState,
  type Page,
} from '@/shared/api/client';
import {
  turnSchema,
  catalogId,
  type Turn,
  type UiAction,
  type ChatMessage,
  type Conversation,
} from '../types/protocol';
export function useAsistente(onChanged: () => Promise<void>) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [turns, setTurns] = useState<Record<string, Turn>>({});
  const [active, setActive] = useState<string | null>(null);
  const [latest, setLatest] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [catalogReady, setCatalogReady] = useState(false);
  const key = useRef<KeyState['current']>(null);
  const createKey = useRef<KeyState['current']>(null);
  const lock = useRef(false);
  const changed = useRef(onChanged);
  useEffect(() => {
    changed.current = onChanged;
  }, [onChanged]);
  const selection = useRef(0);
  const list = useCallback(
    async () =>
      setConversations(
        await allPages<Conversation>('/assistant/conversations'),
      ),
    [],
  );
  const load = useCallback(async (id: string) => {
    const ticket = ++selection.current;
    const detail = await api<{
      messages: Page<ChatMessage>;
      latestTurnId: string | null;
    }>(`/assistant/conversations/${id}?pageSize=100`);
    const rows = [...detail.messages.items];
    let page = 2;
    while (rows.length < detail.messages.total) {
      const next = await api<{ messages: Page<ChatMessage> }>(
        `/assistant/conversations/${id}?pageSize=100&page=${page++}`,
      );
      if (!next.messages.items.length) break;
      rows.push(...next.messages.items);
    }
    const ids = [
      ...new Set(
        [
          ...rows.filter((m) => m.role === 'assistant').map((m) => m.turnId),
          detail.latestTurnId,
        ].filter((x): x is string => Boolean(x)),
      ),
    ];
    const snapshots: Turn[] = [];
    for (const turnId of ids)
      snapshots.push(turnSchema.parse(await api(`/assistant/turns/${turnId}`)));
    if (ticket !== selection.current) return;
    setConversationId(id);
    setMessages(rows.reverse());
    setTurns(Object.fromEntries(snapshots.map((t) => [t.id, t])));
    setLatest(detail.latestTurnId);
    const last = snapshots.find((t) => t.id === detail.latestTurnId);
    setBusy(Boolean(last && ['queued', 'running'].includes(last.status)));
    setActive(
      last && ['queued', 'running'].includes(last.status) ? last.id : null,
    );
  }, []);
  useEffect(() => {
    let live = true;
    Promise.all([
      Promise.resolve().then(() => list()),
      api<{ catalogId: string }>('/assistant/catalog'),
    ])
      .then(([, catalog]) => {
        if (live) {
          if (catalog.catalogId !== catalogId)
            throw new Error('Catálogo de interfaz no compatible.');
          setCatalogReady(true);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [list]);
  useEffect(() => {
    if (!active) return;
    let closed = false;
    const stream = new EventSource(
      `${API_BASE}/assistant/turns/${active}/events`,
      { withCredentials: true },
    );
    const receive = (event: MessageEvent) => {
      try {
        const snapshot = turnSchema.parse(JSON.parse(event.data));
        setTurns((t) => ({ ...t, [snapshot.id]: snapshot }));
        if (['completed', 'failed', 'interrupted'].includes(snapshot.status)) {
          stream.close();
          setActive(null);
          if (snapshot.error) setError(snapshot.error.message);
          void load(snapshot.conversationId).catch((e) => {
            setError(e.message);
            setBusy(false);
          });
          void list().catch(() => {});
          if (snapshot.status === 'completed')
            void changed.current().catch((e) => setError(e.message));
        }
      } catch {
        setError('No pudimos interpretar la respuesta del asistente.');
        stream.close();
        setActive(null);
        setBusy(false);
      }
    };
    stream.addEventListener('snapshot', receive as EventListener);
    stream.onerror = () => {
      stream.close();
      if (!closed) {
        setError(
          'Se interrumpió la conexión. Recupera la respuesta para ver su estado.',
        );
        setActive(null);
        setBusy(false);
      }
    };
    return () => {
      closed = true;
      stream.close();
    };
  }, [active, list, load]);
  const send = async (text = draft) => {
    if (lock.current || active || !text.trim() || !catalogReady) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      let id = conversationId;
      if (!id) {
        const body = { title: text.trim().slice(0, 80) };
        const c = await api<Conversation>('/assistant/conversations', {
          method: 'POST',
          body,
          key: mutationKey(createKey, body),
        });
        id = c.id;
        setConversationId(id);
        createKey.current = null;
      }
      const body = { content: text.trim() };
      const receipt = await api<{ turnId: string }>(
        `/assistant/conversations/${id}/messages`,
        { method: 'POST', body, key: mutationKey(key, { id, body }) },
      );
      key.current = null;
      setDraft('');
      setLatest(receipt.turnId);
      setActive(receipt.turnId);
      await load(id);
      await list();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo enviar el mensaje.',
      );
      setBusy(false);
    } finally {
      lock.current = false;
    }
  };
  const act = async (action: UiAction) => {
    if (lock.current || active || !conversationId) return false;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const receipt = await api<{ turnId: string }>(
        `/assistant/conversations/${conversationId}/actions`,
        {
          method: 'POST',
          body: action,
          key: mutationKey(key, { conversationId, action }),
        },
      );
      key.current = null;
      setLatest(receipt.turnId);
      setActive(receipt.turnId);
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo completar la acción.',
      );
      setBusy(false);
      return false;
    } finally {
      lock.current = false;
    }
  };
  const open = async (id: string) => {
    if (busy || active) return;
    setLoading(true);
    setError('');
    try {
      await load(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo abrir.');
    } finally {
      setLoading(false);
    }
  };
  return {
    conversations,
    conversationId,
    messages,
    turns,
    latest,
    draft,
    setDraft,
    error,
    busy: busy || Boolean(active),
    loading,
    catalogReady,
    send,
    act,
    open,
    newChat: () => {
      if (busy || active) return;

      setConversationId(null);
      setMessages([]);
      setTurns({});
      setLatest(null);
      setDraft('');
      setError('');
      key.current = null;
      createKey.current = null;
    },
    recover: () => {
      if (conversationId) void open(conversationId);
    },
  };
}
