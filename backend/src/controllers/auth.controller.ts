import { Request, Response } from 'express';
import { login, refreshToken, changePassword, forgotPassword, resetPassword } from '../services/auth.service';
import { AuthRequest } from '../types';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginHandler(req: Request, res: Response) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await login(data.email, data.password);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(401).json({ error: (error as Error).message });
  }
}

export async function refreshHandler(req: Request, res: Response) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }
    const tokens = await refreshToken(token);
    res.json(tokens);
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
}

export async function meHandler(req: AuthRequest, res: Response) {
  res.json({
    userId: req.user!.userId,
    role: req.user!.role,
    permissions: req.user!.permissions,
  });
}

export async function changePasswordHandler(req: AuthRequest, res: Response) {
  try {
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6),
    }).parse(req.body);
    await changePassword(req.user!.userId, currentPassword, newPassword);
    res.json({ message: 'Contraseña cambiada exitosamente' });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Datos inválidos' });
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const result = await forgotPassword(email);
    res.json({ message: 'Si el email existe, recibirás instrucciones', ...result });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function resetPasswordHandler(req: Request, res: Response) {
  try {
    const { token, newPassword } = z.object({
      token: z.string().min(1),
      newPassword: z.string().min(6),
    }).parse(req.body);
    await resetPassword(token, newPassword);
    res.json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
