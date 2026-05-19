import jwt, {
  type JwtPayload as DefaultJwtPayload,
  type SignOptions,
} from 'jsonwebtoken';

export type AuthTokenPayload = {
  sub: string;
  email: string;
  name: string;
};

export type PasswordResetTokenPayload = {
  sub: string;
  tokenId: string;
  scope: 'password_reset';
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

export function generatePasswordResetToken(
  payload: { sub: string; tokenId: string },
  expiresIn: SignOptions['expiresIn'] = '10m',
): string {
  return jwt.sign(
    {
      sub: payload.sub,
      tokenId: payload.tokenId,
      scope: 'password_reset',
    },
    getJwtSecret(),
    {
      expiresIn,
    },
  );
}

export function verifyPasswordResetToken(token: string): PasswordResetTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());

  if (typeof decoded === 'string') {
    throw new Error('Token invalido');
  }

  const payload = decoded as DefaultJwtPayload & Partial<PasswordResetTokenPayload>;

  if (!payload.sub || !payload.tokenId || payload.scope !== 'password_reset') {
    throw new Error('Token invalido');
  }

  return {
    sub: String(payload.sub),
    tokenId: String(payload.tokenId),
    scope: 'password_reset',
  };
}