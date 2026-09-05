import type {
  ApiErrorBody,
  Author,
  Book,
  Category,
  Copy,
  Loan,
  Paginated,
  Reservation,
  User,
} from './types';

const BASE = '/api/v1';
/**
 * Chave de sessao de proposito NEUTRA. Ja sobreviveu a duas trocas de nome do
 * produto carregando o nome antigo dentro dela; amarrar armazenamento a marca
 * so gera residuo na proxima renomeacao.
 */
const TOKEN_KEY = "sessao.token";

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

    /*
     * A direcao pode resetar a senha de alguem que esta com a tela aberta. O
     * servidor recusa na hora, e cada tela pegaria esse 403 como se fosse um
     * erro dela. Avisando daqui, o aviso chega mesmo quando quem chamou trata
     * o proprio erro — e a pessoa cai na troca de senha em vez de ficar
     * lendo uma recusa que ela nao sabe resolver.
     */
    if (err?.code === 'SENHA_PADRAO') {
      window.dispatchEvent(new CustomEvent('sessao:senha-padrao'));
    }
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

  me: () => request<User>("/auth/me"),

  trocarSenha: (senhaAtual: string, senhaNova: string) =>
    request<User>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ senhaAtual, senhaNova }),
    }),

  /** Direcao cria conta de equipe. A senha nao vai no corpo: e a padrao. */
  criarFuncionario: (dados: { name: string; email: string; role: "ADMIN" | "LIBRARIAN" }) =>
    request<User>("/users", { method: "POST", body: JSON.stringify(dados) }),

  /** O "esqueci a senha" desta versao: a direcao devolve a conta para a padrao. */
  resetarSenha: (id: string) =>
    request<void>(`/users/${id}/reset-password`, { method: "POST" }),

  desativarUsuario: (id: string) => request<void>(`/users/${id}`, { method: "DELETE" }),

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

  /* ---- Gestao do acervo. Tudo aqui exige papel de balcao ou direcao, e e o
     servidor que recusa quem nao tem — a tela so esconde o que nao adianta. */

  authors: (params: { search?: string; perPage?: number }) =>
    request<Paginated<Author>>(`/authors${qs(params)}`),

  createAuthor: (name: string, bio?: string) =>
    request<Author>("/authors", { method: "POST", body: JSON.stringify({ name, bio }) }),

  categories: (params: { search?: string; perPage?: number }) =>
    request<Paginated<Category>>(`/categories${qs(params)}`),

  createCategory: (name: string) =>
    request<Category>("/categories", { method: "POST", body: JSON.stringify({ name }) }),

  createBook: (dados: {
    isbn: string;
    title: string;
    authorIds: string[];
    categoryId?: string;
    publisher?: string;
    publishedYear?: number;
    synopsis?: string;
  }) => request<Book>("/books", { method: "POST", body: JSON.stringify(dados) }),

  createCopy: (dados: { bookId: string; code: string; shelf?: string }) =>
    request<Copy>("/copies", { method: "POST", body: JSON.stringify(dados) }),

  updateCopy: (id: string, dados: { shelf?: string; status?: "AVAILABLE" | "MAINTENANCE" | "LOST" }) =>
    request<Copy>(`/copies/${id}`, { method: "PATCH", body: JSON.stringify(dados) }),
};
