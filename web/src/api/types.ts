export type Role = 'ADMIN' | 'LIBRARIAN' | 'MEMBER';

export type CopyStatus = 'AVAILABLE' | 'ON_LOAN' | 'RESERVED' | 'MAINTENANCE' | 'LOST';
export type LoanStatus = 'ACTIVE' | 'RETURNED' | 'LATE';
export type ReservationStatus = 'WAITING' | 'READY' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active?: boolean;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  synopsis: string | null;
  publisher: string | null;
  publishedYear: number | null;
  category: { id: string; name: string } | null;
  authors: { id: string; name: string }[];
  totalCopies: number;
  availableCopies?: number;
  copies?: Copy[];
}

export interface Copy {
  id: string;
  code: string;
  status: CopyStatus;
  shelf: string | null;
  bookId?: string;
  book?: { id: string; title: string; isbn: string };
  loans?: { id: string; dueAt: string; user: { id: string; name: string } }[];
}

export interface Loan {
  id: string;
  userId: string;
  copyId: string;
  loanedAt: string;
  dueAt: string;
  returnedAt: string | null;
  renewals: number;
  fine: number;
  status: LoanStatus;
  /** Campos derivados que o servidor calcula na hora — nunca recalcular aqui. */
  isOverdue: boolean;
  daysLate: number;
  fineDue: number;
  user: { id: string; name: string; email: string };
  copy: Copy & { book: { id: string; title: string; isbn: string } };
  /** Só na devolução: id da reserva que o exemplar acabou de acionar. */
  reservaAcionada?: string | null;
}

export interface Reservation {
  id: string;
  status: ReservationStatus;
  expiresAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  book: { id: string; title: string; isbn: string };
  posicaoNaFila?: number;
}

/** Erro de negócio do servidor. A mensagem já vem em português: exiba, não reescreva. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: { campo: string; erro: string }[];
  };
}
