import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  roleId: z.string().uuid(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  phone: z.string().optional(),
  roleId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      role: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      role: {
        select: { id: true, name: true, description: true },
      },
    },
  });
}

export async function createUser(data: z.infer<typeof createUserSchema>) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error('El email ya está registrado');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone || null,
      roleId: data.roleId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      roleId: true,
      createdAt: true,
    },
  });
}

export async function updateUser(id: string, data: z.infer<typeof updateUserSchema>) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error('El email ya está registrado');
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.roleId) updateData.roleId = data.roleId;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      roleId: true,
    },
  });
}

export async function deactivateUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: { select: { name: true } } },
  });
  if (!user) throw new Error('Usuario no encontrado');
  if (user.role.name === 'SUPERADMIN') throw new Error('No se puede desactivar SUPERADMIN');
  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, isActive: true },
  });
}

export async function activateUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('Usuario no encontrado');
  return prisma.user.update({
    where: { id },
    data: { isActive: true },
    select: { id: true, isActive: true },
  });
}

export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: { select: { name: true } } },
  });
  if (!user) throw new Error('Usuario no encontrado');
  if (user.role.name === 'SUPERADMIN') throw new Error('No se puede eliminar SUPERADMIN');
  await prisma.notificationLog.deleteMany({ where: { userId: id } });
  await prisma.winner.deleteMany({ where: { registeredById: id } });
  await prisma.ticket.deleteMany({ where: { registeredById: id } });
  await prisma.raffle.deleteMany({ where: { createdById: id } });
  return prisma.user.delete({ where: { id } });
}

export async function listRoles() {
  return prisma.role.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      permissions: {
        select: {
          permission: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}
