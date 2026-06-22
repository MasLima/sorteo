import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

export function requirePermission(...permissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const hasPermission = permissions.some((p) =>
      req.user!.permissions.includes(p),
    );

    if (!hasPermission) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    }

    next();
  };
}
