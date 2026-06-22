import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  role: string;
  permissions: string[];
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}
