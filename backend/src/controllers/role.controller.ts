import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../utils/prisma';
import { z } from 'zod';

const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissionIds: z.array(z.string().uuid()),
});

const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export async function listRoles(_req: AuthRequest, res: Response) {
  try {
    const roles = await prisma.role.findMany({
      select: {
        id: true, name: true, description: true,
        permissions: {
          select: { permission: { select: { id: true, name: true } } },
        },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(roles);
  } catch { res.status(500).json({ error: 'Error al listar roles' }); }
}

export async function listPermissions(_req: AuthRequest, res: Response) {
  try {
    const perms = await prisma.permission.findMany({ orderBy: { name: 'asc' } });
    res.json(perms);
  } catch { res.status(500).json({ error: 'Error al listar permisos' }); }
}

export async function createRole(req: AuthRequest, res: Response) {
  try {
    const data = createRoleSchema.parse(req.body);
    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description || null,
        permissions: {
          create: data.permissionIds.map((id) => ({ permissionId: id })),
        },
      },
      select: { id: true, name: true, description: true },
    });
    res.status(201).json(role);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function updateRole(req: AuthRequest, res: Response) {
  try {
    const data = updateRoleSchema.parse(req.body);
    const id = String(req.params.id);
    if (data.permissionIds) {
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });
      await prisma.rolePermission.createMany({
        data: data.permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
      });
    }
    const role = await prisma.role.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
      },
      select: { id: true, name: true, description: true },
    });
    res.json(role);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function deleteRole(req: AuthRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
    if (!role) return res.status(404).json({ error: 'Rol no encontrado' });
    if (role._count.users > 0) return res.status(400).json({ error: 'No se puede eliminar un rol con usuarios asignados' });
    if (role.name === 'SUPERADMIN') return res.status(400).json({ error: 'No se puede eliminar SUPERADMIN' });
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await prisma.role.delete({ where: { id } });
    res.json({ message: 'Rol eliminado' });
  } catch { res.status(500).json({ error: 'Error al eliminar rol' }); }
}

export async function createPermission(req: AuthRequest, res: Response) {
  try {
    const { name } = z.object({ name: z.string().min(1) }).parse(req.body);
    const perm = await prisma.permission.create({ data: { name } });
    res.status(201).json(perm);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Datos inválidos' });
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function deletePermission(req: AuthRequest, res: Response) {
  try {
    const id = String(req.params.id);
    await prisma.rolePermission.deleteMany({ where: { permissionId: id } });
    await prisma.permission.delete({ where: { id } });
    res.json({ message: 'Permiso eliminado' });
  } catch { res.status(500).json({ error: 'Error al eliminar permiso' }); }
}