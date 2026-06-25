import { Response } from 'express';
import { AuthRequest } from '../types';
import { scanPaymentImage } from '../services/ocr.service';
import prisma from '../utils/prisma';

export async function scanPaymentHandler(req: AuthRequest, res: Response) {
  try {
    const raffleId = String(req.params.id);
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Imagen requerida' });

    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle) return res.status(404).json({ error: 'Sorteo no encontrado' });

    const scan = await scanPaymentImage(file.path);
    const data: any = {
      rawText: scan.rawText,
      confidence: scan.confidence,
      amount: scan.amount,
      date: scan.date,
      time: scan.time,
      operationNumber: scan.operationNumber,
    };

    if (!scan.amount) {
      return res.json({ ...data, matched: false, autoConfirmed: false, error: 'No se identificó un monto' });
    }

    // Try matching by operation number first
    if (scan.operationNumber) {
      const byOp = await prisma.ticket.findFirst({
        where: { raffleId, status: 'PENDING', operationNumber: scan.operationNumber },
        include: { participant: { select: { name: true, phone: true } } },
      });
      if (byOp) {
        await confirmTicket(byOp.id, scan);
        return res.json({
          ...data, matched: true, autoConfirmed: true,
          ticketNumber: byOp.ticketNumber, participant: byOp.participant.name,
        });
      }
    }

    // Try matching by amount
    const pending = await prisma.ticket.findMany({
      where: { raffleId, status: 'PENDING', paymentAmount: scan.amount },
      include: { participant: { select: { id: true, name: true, phone: true } } },
      orderBy: { assignedAt: 'asc' },
    });

    if (pending.length === 1) {
      await confirmTicket(pending[0].id, scan);
      return res.json({
        ...data, matched: true, autoConfirmed: true,
        ticketNumber: pending[0].ticketNumber, participant: pending[0].participant.name,
      });
    }

    // Return candidates or empty
    return res.json({
      ...data, matched: false, autoConfirmed: false,
      candidates: pending.map((t) => ({
        id: t.id, ticketNumber: t.ticketNumber,
        participant: t.participant, assignedAt: t.assignedAt,
      })),
      error: pending.length === 0
        ? 'No hay tickets pendientes con ese monto. Puedes crear uno nuevo.'
        : `Hay ${pending.length} tickets pendientes con ese monto. Selecciona uno.`,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function matchScanHandler(req: AuthRequest, res: Response) {
  try {
    const raffleId = String(req.params.id);
    const { ticketId, amount, date, time, operationNumber, rawText } = req.body;
    if (!ticketId) return res.status(400).json({ error: 'Se requiere ticketId' });

    await confirmTicket(ticketId, { amount, date, time, operationNumber, rawText });
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { participant: { select: { name: true } } },
    });
    res.json({ matched: true, ticketNumber: ticket?.ticketNumber, participant: ticket?.participant.name });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function createFromScanHandler(req: AuthRequest, res: Response) {
  try {
    const raffleId = String(req.params.id);
    const { participantName, participantPhone, participantEmail, amount, date, time, operationNumber, rawText } = req.body;
    if (!participantName || !participantPhone || !amount) {
      return res.status(400).json({ error: 'Nombre, teléfono y monto requeridos' });
    }

    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle) return res.status(404).json({ error: 'Sorteo no encontrado' });

    const max = await prisma.ticket.findFirst({
      where: { raffleId }, orderBy: { ticketNumber: 'desc' }, select: { ticketNumber: true },
    });
    const ticketNumber = (max?.ticketNumber || 0) + 1;

    let participant = await prisma.participant.findFirst({
      where: { phone: participantPhone },
    });
    if (!participant) {
      participant = await prisma.participant.create({
        data: { name: participantName, phone: participantPhone, email: participantEmail || null },
      });
    }

    const ticket = await prisma.ticket.create({
      data: {
        raffleId, ticketNumber, participantId: participant.id,
        paymentAmount: amount, status: 'CONFIRMED',
        confirmedAt: new Date(), registeredById: req.user!.userId,
        registrationSource: 'MANUAL',
        operationNumber, scanRawText: rawText,
        scannedAt: date && time ? new Date(`${date}T${time}`) : new Date(),
      },
      include: { participant: { select: { name: true } } },
    });

    res.status(201).json({ ticketNumber: ticket.ticketNumber, participant: ticket.participant.name });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

async function confirmTicket(ticketId: string, scan: { amount?: number; date?: string; time?: string; operationNumber?: string; rawText?: string }) {
  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: 'CONFIRMED', confirmedAt: new Date(),
      ...(scan.operationNumber ? { operationNumber: scan.operationNumber } : {}),
      ...(scan.rawText ? { scanRawText: scan.rawText } : {}),
      ...(scan.date && scan.time ? { scannedAt: new Date(`${scan.date}T${scan.time}`) } : {}),
    },
  });
}