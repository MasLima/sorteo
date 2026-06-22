import { Response } from 'express';
import { AuthRequest } from '../types';
import * as notificationService from '../services/notification.service';
import prisma from '../utils/prisma';
import { z } from 'zod';

const notifyTicketSchema = z.object({
  ticketId: z.string().uuid(),
});

const notifyWinnerSchema = z.object({
  raffleId: z.string().uuid(),
});

export async function notifyTicketHandler(req: AuthRequest, res: Response) {
  try {
    const { ticketId } = notifyTicketSchema.parse(req.body);

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { participant: true, raffle: true },
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    const message = notificationService.buildTicketMessage(
      ticket.participant.name,
      ticket.raffle.title,
      ticket.ticketNumber,
    );

    const result = await notificationService.sendWhatsApp(
      ticket.participant.phone,
      message,
      { raffleId: ticket.raffleId, ticketId: ticket.id, userId: req.user!.userId },
    );

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function notifyPaymentConfirmedHandler(req: AuthRequest, res: Response) {
  try {
    const { ticketId } = notifyTicketSchema.parse(req.body);

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { participant: true, raffle: true },
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    const message = notificationService.buildPaymentConfirmedMessage(
      ticket.participant.name,
      ticket.raffle.title,
      ticket.ticketNumber,
    );

    const result = await notificationService.sendWhatsApp(
      ticket.participant.phone,
      message,
      { raffleId: ticket.raffleId, ticketId: ticket.id, userId: req.user!.userId },
    );

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function notifyWinnerHandler(req: AuthRequest, res: Response) {
  try {
    const { raffleId } = notifyWinnerSchema.parse(req.body);

    const winner = await prisma.winner.findUnique({
      where: { raffleId },
      include: { participant: true, ticket: true, raffle: true },
    });
    if (!winner) return res.status(404).json({ error: 'Ganador no encontrado' });

    const message = notificationService.buildWinnerMessage(
      winner.participant.name,
      winner.raffle.title,
      winner.ticket.ticketNumber,
      winner.prize || undefined,
    );

    const result = await notificationService.sendWhatsApp(
      winner.participant.phone,
      message,
      { raffleId: winner.raffleId, ticketId: winner.ticketId, userId: req.user!.userId },
    );

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function notifyCustomHandler(req: AuthRequest, res: Response) {
  try {
    const schema = z.object({
      to: z.string().min(1),
      message: z.string().min(1),
      raffleId: z.string().optional(),
    });
    const { to, message, raffleId } = schema.parse(req.body);

    const result = await notificationService.sendWhatsApp(to, message, {
      raffleId,
      userId: req.user!.userId,
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getLogsHandler(req: AuthRequest, res: Response) {
  try {
    const raffleId = req.query.raffleId ? String(req.query.raffleId) : undefined;
    const logs = await notificationService.getNotificationLog(raffleId);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener logs' });
  }
}
