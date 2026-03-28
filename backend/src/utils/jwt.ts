import jwt, { type JwtPayload as DefaultJwtPayload } from 'jsonwebtoken';

export type AuthTokenPayload = {
  sub: string;
  email: string;
  name: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET não foi definida no arquivo .env');
  }

  return secret;
}

export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());

  if (typeof decoded === 'string') {
    throw new Error('Token inválido');
  }

  const payload = decoded as DefaultJwtPayload & AuthTokenPayload;

  if (!payload.sub || !payload.email || !payload.name) {
    throw new Error('Token inválido');
  }

  return {
    sub: String(payload.sub),
    email: payload.email,
    name: payload.name,
  };
}