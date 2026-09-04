import type {
  ApiErrorBody,
  Book,
  Copy,
  Loan,
  Paginated,
  Reservation,
  User,
} from './types';

const BASE = '/api/v1';
const TOKEN_KEY = 'lombada.token';

/**
 * Erro que carrega a mensagem que o servidor deu. A regra de negócio é do
 * servidor; a tela só precisa saber o código e mostrar o texto.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly details?: { campo: string; erro: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const token = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const t = token.get();
  let res: Response;

  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    // Servidor fora do ar é diferente de regra recusada; o balcão precisa saber qual.
    throw new ApiError(
      'Não consegui falar com o servidor. Confira se a API está no ar.',
      'NETWORK',
      0,
    );
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const err = (body as ApiErrorBody | null)?.error;
    throw new ApiError(
      err?.message ?? 'Erro inesperado do servidor.',
      err?.code ?? 'UNKNOWN',
      res.status,
      err?.details,
    );
  }

  return body as T;
}

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') s.set(k, String(v));
  }
  const out = s.toString();
  return out ? `?${out}` : '';
};

export const api = {
  login: (email: string, password: string) =>
    request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<User>('/auth/me'),

  books: (params: { search?: string; available?: boolean; page?: number; perPage?: number }) =>
    request<Paginated<Book>>(`/books${qs(params)}`),

  book: (id: string) => request<Book>(`/books/${id}`),

  copies: (params: {
    bookId?: string;
    status?: string;
    /** Código de tombo — o gesto do balcão, com o livro na mão. */
    code?: string;
    page?: number;
    perPage?: number;
  }) => request<Paginated<Copy>>(`/copies${qs(params)}`),

  copy: (id: string) => request<Copy>(`/copies/${id}`),

  loans: (params: {
    userId?: string;
    status?: string;
    overdue?: boolean;
    page?: number;
    perPage?: number;
  }) => request<Paginated<Loan>>(`/loans${qs(params)}`),

  createLoan: (copyId: string, userId?: string) =>
    request<Loan>('/loans', { method: 'POST', body: JSON.stringify({ copyId, userId }) }),

  returnLoan: (id: string) => request<Loan>(`/loans/${id}/return`, { method: 'POST' }),

  renewLoan: (id: string) => request<Loan>(`/loans/${id}/renew`, { method: 'POST' }),

  reservations: (params: { status?: string; bookId?: string; page?: number; perPage?: number }) =>
    request<Paginated<Reservation>>(`/reservations${qs(params)}`),

  createReservation: (bookId: string, userId?: string) =>
    request<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify({ bookId, userId }),
    }),

  cancelReservation: (id: string) =>
    request<Reservation>(`/reservations/${id}`, { method: 'DELETE' }),

  expireStale: () => request<{ expiradas: number }>('/reservations/expire-stale', { method: 'POST' }),

  users: (params: { search?: string; role?: string; page?: number; perPage?: number }) =>
    request<Paginated<User>>(`/users${qs(params)}`),
};
