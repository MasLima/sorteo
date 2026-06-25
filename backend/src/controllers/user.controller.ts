import { Response } from 'express';
import { AuthRequest } from '../types';
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
  deleteUser,
  createUserSchema,
  updateUserSchema,
  listRoles,
} from '../services/user.service';
import { z } from 'zod';

export async function listHandler(_req: AuthRequest, res: Response) {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
}

export async function getByIdHandler(req: AuthRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
}

export async function createHandler(req: AuthRequest, res: Response) {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await createUser(data);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function updateHandler(req: AuthRequest, res: Response) {
  try {
    const data = updateUserSchema.parse(req.body);
    const user = await updateUser(String(req.params.id), data);
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function deactivateHandler(req: AuthRequest, res: Response) {
  try {
    const user = await deactivateUser(String(req.params.id));
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function activateHandler(req: AuthRequest, res: Response) {
  try {
    const user = await activateUser(String(req.params.id));
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function deleteHandler(req: AuthRequest, res: Response) {
  try {
    await deleteUser(String(req.params.id));
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function rolesHandler(_req: AuthRequest, res: Response) {
  try {
    const roles = await listRoles();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar roles' });
  }
}
