import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { registerTicket } from '../services/ticket.service';

const router = Router();

const publicRegisterSchema = z.object({
  raffleId: z.string().uuid(),
  participantName: z.string().min(1),
  participantPhone: z.string().min(1),
  paymentAmount: z.number().positive(),
});

router.get('/raffles/:id', async (req: Request, res: Response) => {
  try {
    const raffle = await prisma.raffle.findUnique({
      where: { id: String(req.params.id), status: 'ACTIVE' },
      select: {
        id: true,
        title: true,
        description: true,
        ticketPrice: true,
        yapePhone: true,
      },
    });
    if (!raffle) return res.status(404).json({ error: 'Sorteo no encontrado' });
    res.json(raffle);
  } catch {
    res.status(500).json({ error: 'Error al obtener sorteo' });
  }
});

router.post('/register-ticket', async (req: Request, res: Response) => {
  try {
    const { raffleId, ...data } = publicRegisterSchema.parse(req.body);
    const ticket = await registerTicket(raffleId, data, 'self-register');
    res.status(201).json({
      ticketNumber: ticket.ticketNumber,
      participantName: ticket.participant.name,
      raffleTitle: ticket.raffle.title,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

export default router;
