import { Response } from 'express';
import { AuthRequest } from '../types';
import {
  listRaffles,
  getRaffleById,
  createRaffle,
  updateRaffle,
  deleteRaffle,
  deleteTicket,
  createRaffleSchema,
  updateRaffleSchema,
} from '../services/raffle.service';
import { registerTicket, confirmTicket, registerTicketSchema, confirmTicketSchema } from '../services/ticket.service';
import { registerWinner, registerWinnerSchema } from '../services/winner.service';
import { z } from 'zod';

export async function listHandler(_req: AuthRequest, res: Response) {
  try {
    const raffles = await listRaffles();
    res.json(raffles);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar sorteos' });
  }
}

export async function getByIdHandler(req: AuthRequest, res: Response) {
  try {
    const raffle = await getRaffleById(String(req.params.id));
    if (!raffle) return res.status(404).json({ error: 'Sorteo no encontrado' });
    res.json(raffle);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener sorteo' });
  }
}

export async function createHandler(req: AuthRequest, res: Response) {
  try {
    const data = createRaffleSchema.parse(req.body);
    const raffle = await createRaffle(data, req.user!.userId);
    res.status(201).json(raffle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function updateHandler(req: AuthRequest, res: Response) {
  try {
    const data = updateRaffleSchema.parse(req.body);
    const raffle = await updateRaffle(String(req.params.id), data);
    res.json(raffle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function registerTicketHandler(req: AuthRequest, res: Response) {
  try {
    const data = registerTicketSchema.parse(req.body);
    const ticket = await registerTicket(String(req.params.id), data, req.user!.userId);
    res.status(201).json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function confirmTicketHandler(req: AuthRequest, res: Response) {
  try {
    const { status } = confirmTicketSchema.parse(req.body);
    const ticket = await confirmTicket(String(req.params.ticketId), status);
    res.json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function deleteHandler(req: AuthRequest, res: Response) {
  try {
    await deleteRaffle(String(req.params.id));
    res.json({ message: 'Sorteo eliminado' });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function deleteTicketHandler(req: AuthRequest, res: Response) {
  try {
    await deleteTicket(String(req.params.ticketId));
    res.json({ message: 'Ticket eliminado' });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function listTicketsHandler(req: AuthRequest, res: Response) {
  try {
    const { listTicketsByRaffle } = await import('../services/ticket.service');
    const tickets = await listTicketsByRaffle(String(req.params.id));
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar tickets' });
  }
}

export async function registerWinnerHandler(req: AuthRequest, res: Response) {
  try {
    const data = registerWinnerSchema.parse(req.body);
    const winner = await registerWinner(String(req.params.id), data, req.user!.userId);
    res.status(201).json(winner);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(400).json({ error: (error as Error).message });
  }
}
