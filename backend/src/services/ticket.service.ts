import prisma from '../utils/prisma';
import { z } from 'zod';

export const registerTicketSchema = z.object({
  participantName: z.string().min(1),
  participantPhone: z.string().min(1),
  participantEmail: z.string().email().optional().nullable(),
  paymentAmount: z.number().positive(),
  paymentProof: z.string().optional().nullable(),
  paymentNote: z.string().optional().nullable(),
});

export const confirmTicketSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED']),
});

export async function getNextTicketNumber(raffleId: string): Promise<number> {
  const lastTicket = await prisma.ticket.findFirst({
    where: { raffleId },
    orderBy: { ticketNumber: 'desc' },
    select: { ticketNumber: true },
  });
  return (lastTicket?.ticketNumber ?? 0) + 1;
}

async function createParticipant(data: { participantName: string; participantPhone: string; participantEmail?: string | null }) {
  let participant = await prisma.participant.findFirst({
    where: { name: data.participantName, phone: data.participantPhone },
  });

  if (!participant) {
    participant = await prisma.participant.create({
      data: { name: data.participantName, phone: data.participantPhone, email: data.participantEmail || null },
    });
  }
  return participant;
}

export async function registerTicket(
  raffleId: string,
  data: z.infer<typeof registerTicketSchema>,
  userId: string,
) {
  const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
  if (!raffle) throw new Error('Sorteo no encontrado');
  if (raffle.status !== 'ACTIVE') throw new Error('El sorteo no está activo');

  if (raffle.maxTickets) {
    const currentCount = await prisma.ticket.count({ where: { raffleId } });
    if (currentCount >= raffle.maxTickets) throw new Error('El sorteo ha alcanzado el máximo de tickets');
  }

  const participant = await createParticipant(data);
  const ticketNumber = await getNextTicketNumber(raffleId);

  return prisma.ticket.create({
    data: {
      raffleId,
      participantId: participant.id,
      ticketNumber,
      paymentAmount: data.paymentAmount,
      paymentProof: data.paymentProof || null,
      paymentNote: data.paymentNote || null,
      registeredById: userId,
      registrationSource: 'MANUAL',
    },
    include: {
      participant: { select: { id: true, name: true, phone: true } },
      raffle: { select: { title: true } },
    },
  });
}

export async function registerTicketPublic(
  raffleId: string,
  data: { participantName: string; participantPhone: string; paymentAmount: number },
) {
  const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
  if (!raffle) throw new Error('Sorteo no encontrado');
  if (raffle.status !== 'ACTIVE') throw new Error('El sorteo no está activo');

  if (raffle.maxTickets) {
    const currentCount = await prisma.ticket.count({ where: { raffleId } });
    if (currentCount >= raffle.maxTickets) throw new Error('El sorteo ha alcanzado el máximo de tickets');
  }

  const participant = await createParticipant(data);
  const ticketNumber = await getNextTicketNumber(raffleId);

  return prisma.ticket.create({
    data: {
      raffleId,
      participantId: participant.id,
      ticketNumber,
      paymentAmount: data.paymentAmount,
      status: 'PENDING',
      registrationSource: 'PUBLIC',
    },
    include: {
      participant: { select: { id: true, name: true, phone: true } },
      raffle: { select: { title: true } },
    },
  });
}

export async function confirmTicket(ticketId: string, status: 'CONFIRMED' | 'CANCELLED') {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket no encontrado');

  return prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status,
      confirmedAt: status === 'CONFIRMED' ? new Date() : null,
    },
    include: {
      participant: { select: { name: true, phone: true } },
      raffle: { select: { title: true } },
    },
  });
}

export async function listTicketsByRaffle(raffleId: string) {
  return prisma.ticket.findMany({
    where: { raffleId },
    include: {
      participant: { select: { id: true, name: true, phone: true } },
      registeredBy: { select: { name: true } },
    },
    orderBy: { ticketNumber: 'asc' },
  });
}
