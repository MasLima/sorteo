import prisma from '../utils/prisma';
import { z } from 'zod';

export const registerWinnerSchema = z.object({
  ticketId: z.string().uuid(),
  prize: z.string().optional().nullable(),
});

export async function registerWinner(
  raffleId: string,
  data: z.infer<typeof registerWinnerSchema>,
  userId: string,
) {
  const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
  if (!raffle) throw new Error('Sorteo no encontrado');

  const existingWinner = await prisma.winner.findUnique({ where: { raffleId } });
  if (existingWinner) throw new Error('El sorteo ya tiene un ganador registrado');

  const ticket = await prisma.ticket.findUnique({
    where: { id: data.ticketId },
    include: { participant: true },
  });
  if (!ticket) throw new Error('Ticket no encontrado');
  if (ticket.raffleId !== raffleId) throw new Error('El ticket no pertenece a este sorteo');

  const winner = await prisma.winner.create({
    data: {
      raffleId,
      ticketId: data.ticketId,
      participantId: ticket.participantId,
      prize: data.prize || null,
      registeredById: userId,
    },
    include: {
      participant: { select: { name: true, phone: true } },
      ticket: { select: { ticketNumber: true } },
      raffle: { select: { title: true } },
    },
  });

  await prisma.raffle.update({
    where: { id: raffleId },
    data: { status: 'COMPLETED' },
  });

  return winner;
}
