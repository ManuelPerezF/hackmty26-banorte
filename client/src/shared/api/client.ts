export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  `http://${typeof window === 'undefined' ? '127.0.0.1' : window.location.hostname}:3001/api/v1`;
export type Session = {
  user: { id: string; email: string; displayName: string };
  expiresAt: number;
  csrfToken: string;
};
let csrf: string | null = null;
export function setSession(session: Session | null) {
  csrf = session?.csrfToken ?? null;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    key?: string;
    public?: boolean;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  if (method !== 'GET' && !options.public && !csrf)
    setSession(await api<Session>('/auth/session'));
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: 'include',
      signal: options.signal,
      headers: {
        ...(options.body !== undefined
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(!options.public && method !== 'GET' && csrf
          ? { 'X-CSRF-Token': csrf }
          : {}),
        ...(options.key ? { 'Idempotency-Key': options.key } : {}),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError(
      0,
      'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
    );
  }
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    if (response.status === 401 && !options.public) {
      setSession(null);
      window.dispatchEvent(new Event('bank:unauthorized'));
    }
    throw new ApiError(
      response.status,
      typeof data?.message === 'string'
        ? data.message
        : 'No se pudo completar la solicitud.',
      data?.code,
    );
  }
  return data as T;
}
export type KeyState = { current: { signature: string; key: string } | null };
export function mutationKey(ref: KeyState, input: unknown) {
  const signature = JSON.stringify(input);
  if (ref.current?.signature !== signature)
    ref.current = { signature, key: crypto.randomUUID() };
  return ref.current.key;
}
export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
export async function allPages<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  while (true) {
    const result = await api<Page<T>>(
      `${path}${path.includes('?') ? '&' : '?'}page=${page}&pageSize=100`,
      { signal },
    );
    items.push(...result.items);
    if (items.length >= result.total || !result.items.length) return items;
    page++;
  }
}

export function formText(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}
