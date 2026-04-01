import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Token não informado',
      });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        error: 'Token mal formatado',
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({
        error: 'JWT_SECRET não definida no ambiente',
      });
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    req.user = decoded;

    return next();
  } catch {
    return res.status(401).json({
      error: 'Token inválido ou expirado',
    });
  }
}