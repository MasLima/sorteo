import prisma from '../utils/prisma';
import { z } from 'zod';

export const createRaffleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  ticketPrice: z.number().positive(),
  yapePhone: z.string().optional().nullable(),
  maxTickets: z.number().positive().optional(),
  endDate: z.string().datetime().optional(),
});

export const updateRaffleSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  ticketPrice: z.number().positive().optional(),
  yapePhone: z.string().optional().nullable(),
  maxTickets: z.number().positive().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
});

export async function listRaffles() {
  return prisma.raffle.findMany({
    include: {
      tickets: { select: { id: true, status: true } },
      winner: {
        include: {
          participant: { select: { name: true } },
          ticket: { select: { ticketNumber: true } },
        },
      },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getRaffleById(id: string) {
  return prisma.raffle.findUnique({
    where: { id },
    include: {
      tickets: {
        include: {
          participant: { select: { id: true, name: true, phone: true } },
          registeredBy: { select: { name: true } },
        },
        orderBy: { ticketNumber: 'asc' },
      },
      winner: {
        include: {
          participant: { select: { name: true, phone: true } },
          ticket: { select: { ticketNumber: true } },
          registeredBy: { select: { name: true } },
        },
      },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function createRaffle(data: z.infer<typeof createRaffleSchema>, userId: string) {
  return prisma.raffle.create({
    data: {
      title: data.title,
      description: data.description || null,
      ticketPrice: data.ticketPrice,
      yapePhone: data.yapePhone || null,
      maxTickets: data.maxTickets || null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdById: userId,
    },
  });
}

export async function deleteRaffle(id: string) {
  const raffle = await prisma.raffle.findUnique({ where: { id } });
  if (!raffle) throw new Error('Sorteo no encontrado');

  await prisma.winner.deleteMany({ where: { raffleId: id } });
  await prisma.notificationLog.deleteMany({ where: { raffleId: id } });
  await prisma.ticket.deleteMany({ where: { raffleId: id } });
  return prisma.raffle.delete({ where: { id } });
}

export async function deleteTicket(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket no encontrado');

  await prisma.winner.deleteMany({ where: { ticketId } });
  return prisma.ticket.delete({ where: { id: ticketId } });
}

export async function updateRaffle(id: string, data: z.infer<typeof updateRaffleSchema>) {
  const raffle = await prisma.raffle.findUnique({ where: { id } });
  if (!raffle) throw new Error('Sorteo no encontrado');

  const updateData: Record<string, unknown> = {};
  if (data.title) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.ticketPrice) updateData.ticketPrice = data.ticketPrice;
  if (data.yapePhone !== undefined) updateData.yapePhone = data.yapePhone;
  if (data.maxTickets !== undefined) updateData.maxTickets = data.maxTickets;
  if (data.endDate) updateData.endDate = new Date(data.endDate);
  if (data.status) updateData.status = data.status;

  return prisma.raffle.update({ where: { id }, data: updateData });
}
