import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../shared/AppError';
import { paginated, toSkipTake } from '../../shared/pagination';
import type { createLoanSchema, listLoansSchema } from './loans.schema';
import type { AuthPayload } from '../../middlewares/auth';

const DAY_MS = 24 * 60 * 60 * 1000;
const RESERVATION_PICKUP_DAYS = 2;

const loanInclude = {
  user: { select: { id: true, name: true, email: true } },
  copy: { include: { book: { select: { id: true, title: true, isbn: true } } } },
} satisfies Prisma.LoanInclude;

export function addDays(base: Date, days: number) {
  return new Date(base.getTime() + days * DAY_MS);
}

/** Dias inteiros de atraso. Devolver no proprio dia do vencimento nao gera multa. */
export function daysLate(dueAt: Date, returnedAt: Date) {
  const diff = returnedAt.getTime() - dueAt.getTime();
  return diff <= 0 ? 0 : Math.ceil(diff / DAY_MS);
}

export function calculateFine(dueAt: Date, returnedAt: Date, finePerDay = env.FINE_PER_DAY) {
  return Number((daysLate(dueAt, returnedAt) * finePerDay).toFixed(2));
}

export const loansService = {
  async list(query: z.infer<typeof listLoansSchema>, actor: AuthPayload) {
    const { userId, status, overdue, ...pagination } = query;

    // Um MEMBER so enxerga os proprios emprestimos, mesmo filtrando por outro id.
    const scopedUserId = actor.role === 'MEMBER' ? actor.sub : userId;

    const where: Prisma.LoanWhereInput = {
      ...(scopedUserId && { userId: scopedUserId }),
      ...(status && { status }),
      ...(overdue && { returnedAt: null, dueAt: { lt: new Date() } }),
    };

    const [data, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        include: loanInclude,
        orderBy: { loanedAt: 'desc' },
        ...toSkipTake(pagination),
      }),
      prisma.loan.count({ where }),
    ]);

    return paginated(data.map(withComputedFields), total, pagination);
  },

  async findById(id: string, actor: AuthPayload) {
    const loan = await prisma.loan.findUnique({ where: { id }, include: loanInclude });
    if (!loan) throw AppError.notFound('Emprestimo');
    if (actor.role === 'MEMBER' && loan.userId !== actor.sub) throw AppError.forbidden();
    return withComputedFields(loan);
  },

  async create(input: z.infer<typeof createLoanSchema>, actor: AuthPayload) {
    const targetUserId = input.userId ?? actor.sub;
    if (actor.role === 'MEMBER' && targetUserId !== actor.sub) {
      throw AppError.forbidden('Voce so pode registrar emprestimo em seu proprio nome');
    }

    // Transacao: as checagens abaixo e a escrita precisam ser atomicas, senao
    // dois pedidos simultaneos emprestam o mesmo exemplar.
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: targetUserId } });
      if (!user) throw AppError.notFound('Usuario');
      if (!user.active) throw AppError.forbidden('Usuario inativo nao pode retirar exemplares');

      const emAtraso = await tx.loan.count({
        where: { userId: targetUserId, returnedAt: null, dueAt: { lt: new Date() } },
      });
      if (emAtraso > 0) {
        throw AppError.conflict(
          `Usuario possui ${emAtraso} emprestimo(s) em atraso. Regularize antes de retirar outro.`,
        );
      }

      const ativos = await tx.loan.count({ where: { userId: targetUserId, returnedAt: null } });
      if (ativos >= env.MAX_ACTIVE_LOANS) {
        throw AppError.conflict(
          `Limite de ${env.MAX_ACTIVE_LOANS} emprestimos simultaneos atingido`,
        );
      }

      const copy = await tx.copy.findUnique({ where: { id: input.copyId } });
      if (!copy) throw AppError.notFound('Exemplar');

      let reservaAtendida: string | null = null;

      if (copy.status === 'RESERVED') {
        // Exemplar separado no balcao: so sai para quem esta na frente da fila.
        const reserva = await tx.reservation.findFirst({
          where: { bookId: copy.bookId, userId: targetUserId, status: 'READY' },
        });
        if (!reserva) throw AppError.conflict('Exemplar reservado para outro usuario');
        reservaAtendida = reserva.id;
      } else if (copy.status !== 'AVAILABLE') {
        const motivo = {
          ON_LOAN: 'ja esta emprestado',
          MAINTENANCE: 'esta em manutencao',
          LOST: 'consta como perdido',
        }[copy.status as 'ON_LOAN' | 'MAINTENANCE' | 'LOST'];
        throw AppError.conflict(`Exemplar indisponivel: ${motivo}`);
      }

      const loanedAt = new Date();
      const loan = await tx.loan.create({
        data: {
          userId: targetUserId,
          copyId: copy.id,
          loanedAt,
          dueAt: addDays(loanedAt, env.LOAN_DAYS),
        },
        include: loanInclude,
      });

      await tx.copy.update({ where: { id: copy.id }, data: { status: 'ON_LOAN' } });
      if (reservaAtendida) {
        await tx.reservation.update({
          where: { id: reservaAtendida },
          data: { status: 'FULFILLED' },
        });
      }

      return withComputedFields(loan);
    });
  },

  async giveBack(id: string) {
    return prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id }, include: { copy: true } });
      if (!loan) throw AppError.notFound('Emprestimo');
      if (loan.returnedAt) throw AppError.conflict('Este emprestimo ja foi devolvido');

      const returnedAt = new Date();
      const fine = calculateFine(loan.dueAt, returnedAt);

      const updated = await tx.loan.update({
        where: { id },
        data: { returnedAt, fine, status: fine > 0 ? 'LATE' : 'RETURNED' },
        include: loanInclude,
      });

      // O exemplar devolvido vai direto para quem estiver esperando na fila.
      const proxima = await tx.reservation.findFirst({
        where: { bookId: loan.copy.bookId, status: 'WAITING' },
        orderBy: { createdAt: 'asc' },
      });

      if (proxima) {
        await tx.reservation.update({
          where: { id: proxima.id },
          data: { status: 'READY', expiresAt: addDays(returnedAt, RESERVATION_PICKUP_DAYS) },
        });
        await tx.copy.update({ where: { id: loan.copyId }, data: { status: 'RESERVED' } });
      } else {
        await tx.copy.update({ where: { id: loan.copyId }, data: { status: 'AVAILABLE' } });
      }

      return { ...withComputedFields(updated), reservaAcionada: proxima?.id ?? null };
    });
  },

  async renew(id: string, actor: AuthPayload) {
    return prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id }, include: { copy: true } });
      if (!loan) throw AppError.notFound('Emprestimo');
      if (actor.role === 'MEMBER' && loan.userId !== actor.sub) throw AppError.forbidden();
      if (loan.returnedAt) throw AppError.conflict('Emprestimo ja encerrado');

      if (loan.dueAt < new Date()) {
        throw AppError.conflict('Emprestimo em atraso nao pode ser renovado. Devolva o exemplar.');
      }
      if (loan.renewals >= env.MAX_RENEWALS) {
        throw AppError.conflict(`Limite de ${env.MAX_RENEWALS} renovacao(oes) atingido`);
      }

      const fila = await tx.reservation.count({
        where: { bookId: loan.copy.bookId, status: 'WAITING' },
      });
      if (fila > 0) {
        throw AppError.conflict('Ha reserva na fila para este livro. Renovacao bloqueada.');
      }

      const updated = await tx.loan.update({
        where: { id },
        data: { dueAt: addDays(loan.dueAt, env.LOAN_DAYS), renewals: { increment: 1 } },
        include: loanInclude,
      });
      return withComputedFields(updated);
    });
  },
};

/** Atraso e multa em aberto sao derivados da data — nunca persistidos "por fora". */
function withComputedFields<T extends { dueAt: Date; returnedAt: Date | null; fine: number }>(
  loan: T,
) {
  const now = new Date();
  const atraso = loan.returnedAt ? daysLate(loan.dueAt, loan.returnedAt) : daysLate(loan.dueAt, now);
  return {
    ...loan,
    isOverdue: !loan.returnedAt && atraso > 0,
    daysLate: atraso,
    fineDue: loan.returnedAt ? loan.fine : Number((atraso * env.FINE_PER_DAY).toFixed(2)),
  };
}
