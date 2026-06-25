import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function generateTokens(payload: JwtPayload) {
  const accessOpts: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  const refreshOpts: SignOptions = { expiresIn: JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };

  const accessToken = jwt.sign(payload as object, JWT_SECRET, accessOpts);
  const refreshToken = jwt.sign(payload as object, JWT_SECRET, refreshOpts);
  return { accessToken, refreshToken };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!user || !user.isActive) {
    throw new Error('Credenciales inválidas');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('Credenciales inválidas');
  }

  const permissions = user.role.permissions.map((rp) => rp.permission.name);
  const payload: JwtPayload = {
    userId: user.id,
    role: user.role.name,
    permissions,
  };

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = generateTokens(payload);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
    },
    permissions,
    ...tokens,
  };
}

export async function refreshToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new Error('Usuario no válido');
    }

    const permissions = user.role.permissions.map((rp) => rp.permission.name);
    const payload: JwtPayload = {
      userId: user.id,
      role: user.role.name,
      permissions,
    };

    return generateTokens(payload);
  } catch {
    throw new Error('Token inválido o expirado');
  }
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
