import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/AppError';
import { paginated, toSkipTake } from '../../shared/pagination';
import type { createReservationSchema, listReservationsSchema } from './reservations.schema';
import type { AuthPayload } from '../../middlewares/auth';

const include = {
  user: { select: { id: true, name: true, email: true } },
  book: { select: { id: true, title: true, isbn: true } },
} satisfies Prisma.ReservationInclude;

export const reservationsService = {
  async list(query: z.infer<typeof listReservationsSchema>, actor: AuthPayload) {
    const { bookId, userId, status, ...pagination } = query;
    const scopedUserId = actor.role === 'MEMBER' ? actor.sub : userId;

    const where: Prisma.ReservationWhereInput = {
      ...(bookId && { bookId }),
      ...(scopedUserId && { userId: scopedUserId }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include,
        orderBy: { createdAt: 'asc' },
        ...toSkipTake(pagination),
      }),
      prisma.reservation.count({ where }),
    ]);
    return paginated(data, total, pagination);
  },

  async create(input: z.infer<typeof createReservationSchema>, actor: AuthPayload) {
    const targetUserId = input.userId ?? actor.sub;
    if (actor.role === 'MEMBER' && targetUserId !== actor.sub) {
      throw AppError.forbidden('Voce so pode reservar em seu proprio nome');
    }

    return prisma.$transaction(async (tx) => {
      const book = await tx.book.findUnique({ where: { id: input.bookId }, select: { id: true } });
      if (!book) throw AppError.notFound('Livro');

      const jaNaFila = await tx.reservation.findFirst({
        where: { bookId: input.bookId, userId: targetUserId, status: { in: ['WAITING', 'READY'] } },
      });
      if (jaNaFila) throw AppError.conflict('Voce ja possui uma reserva ativa para este livro');

      const jaComOLivro = await tx.loan.findFirst({
        where: { userId: targetUserId, returnedAt: null, copy: { bookId: input.bookId } },
      });
      if (jaComOLivro) throw AppError.conflict('Voce ja esta com um exemplar deste livro');

      // Reserva serve para o que nao esta na prateleira. Se ha exemplar livre,
      // a resposta certa e "va pegar", nao entrar numa fila de uma pessoa.
      const disponivel = await tx.copy.count({
        where: { bookId: input.bookId, status: 'AVAILABLE' },
      });
      if (disponivel > 0) {
        throw AppError.conflict(
          `Ha ${disponivel} exemplar(es) disponivel(is). Faca o emprestimo direto.`,
        );
      }

      const posicao = await tx.reservation.count({
        where: { bookId: input.bookId, status: 'WAITING' },
      });

      const reservation = await tx.reservation.create({
        data: { bookId: input.bookId, userId: targetUserId },
        include,
      });
      return { ...reservation, posicaoNaFila: posicao + 1 };
    });
  },

  async cancel(id: string, actor: AuthPayload) {
    return prisma.$transaction(async (tx) => {
      const reserva = await tx.reservation.findUnique({ where: { id } });
      if (!reserva) throw AppError.notFound('Reserva');
      if (actor.role === 'MEMBER' && reserva.userId !== actor.sub) throw AppError.forbidden();
      if (reserva.status !== 'WAITING' && reserva.status !== 'READY') {
        throw AppError.conflict('Esta reserva nao esta ativa');
      }

      const cancelada = await tx.reservation.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include,
      });

      // Reserva READY tinha exemplar separado no balcao: ele volta a circular
      // ou passa para o proximo da fila.
      if (reserva.status === 'READY') {
        await liberarExemplarSeparado(tx, reserva.bookId);
      }

      return cancelada;
    });
  },

  /**
   * Expira reservas READY nao retiradas no prazo e devolve o exemplar a fila.
   * Pensado para rodar num cron; exposto como endpoint administrativo.
   */
  async expireStale() {
    const agora = new Date();
    const vencidas = await prisma.reservation.findMany({
      where: { status: 'READY', expiresAt: { lt: agora } },
    });

    for (const reserva of vencidas) {
      await prisma.$transaction(async (tx) => {
        await tx.reservation.update({ where: { id: reserva.id }, data: { status: 'EXPIRED' } });
        await liberarExemplarSeparado(tx, reserva.bookId);
      });
    }

    return { expiradas: vencidas.length };
  },
};

const PICKUP_DAYS = 2;

async function liberarExemplarSeparado(tx: Prisma.TransactionClient, bookId: string) {
  const exemplar = await tx.copy.findFirst({ where: { bookId, status: 'RESERVED' } });
  if (!exemplar) return;

  const proxima = await tx.reservation.findFirst({
    where: { bookId, status: 'WAITING' },
    orderBy: { createdAt: 'asc' },
  });

  if (proxima) {
    await tx.reservation.update({
      where: { id: proxima.id },
      data: {
        status: 'READY',
        expiresAt: new Date(Date.now() + PICKUP_DAYS * 24 * 60 * 60 * 1000),
      },
    });
  } else {
    await tx.copy.update({ where: { id: exemplar.id }, data: { status: 'AVAILABLE' } });
  }
}
