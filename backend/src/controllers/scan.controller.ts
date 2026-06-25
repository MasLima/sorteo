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

    const result = await scanPaymentImage(file.path);
    if (!result.amount) {
      return res.json({
        matched: false,
        rawText: result.rawText,
        confidence: result.confidence,
        error: 'No se pudo identificar un monto en la imagen',
      });
    }

    const pendingTickets = await prisma.ticket.findMany({
      where: { raffleId, status: 'PENDING', paymentAmount: result.amount },
      include: { participant: { select: { name: true, phone: true } } },
    });

    if (pendingTickets.length === 1) {
      const ticket = pendingTickets[0];
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: 'CONFIRMED', confirmedAt: new Date() },
      });
      return res.json({
        matched: true,
        ticketNumber: ticket.ticketNumber,
        participant: ticket.participant.name,
        amount: result.amount,
        rawText: result.rawText,
        confidence: result.confidence,
        autoConfirmed: true,
      });
    }

    return res.json({
      matched: false,
      amount: result.amount,
      candidates: pendingTickets.length,
      rawText: result.rawText,
      confidence: result.confidence,
      autoConfirmed: false,
      error: pendingTickets.length === 0
        ? `No hay tickets pendientes por S/${result.amount}`
        : `Hay ${pendingTickets.length} tickets pendientes con ese monto`,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}