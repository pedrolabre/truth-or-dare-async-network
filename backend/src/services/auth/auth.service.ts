import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { generateToken } from '../../utils/jwt';
import {
  emailAlreadyInUseError,
  invalidCurrentPasswordError,
  samePasswordError,
  userNotFoundError,
} from './settings.errors';
import {
  requireAuthenticatedUserId,
  requireCurrentPassword,
  requireValidNewEmail,
  requireValidNewPassword,
} from './settings.validators';
import { logSettingsCredentialChange } from './settings.observability';
import { registerUserSession } from '../users/sessions.service';
import { sendAccountSecurityEmail } from './email.service';

type SignupInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
  deviceName?: unknown;
  platform?: unknown;
  ipAddress?: string | null;
};

type ChangeEmailInput = {
  userId: string;
  newEmail: unknown;
  currentPassword: unknown;
};

type ChangePasswordInput = {
  userId: string;
  currentPassword: unknown;
  newPassword: unknown;
};

async function sendAccountSecurityEmailSafely(input: {
  to: string;
  subject: string;
  title: string;
  body: string;
  userId: string;
  event: string;
}): Promise<void> {
  try {
    const emailResult = await sendAccountSecurityEmail(input);

    if (!emailResult.ok) {
      console.warn('Account security email failed', {
        userId: input.userId,
        event: input.event,
        reason: emailResult.reason,
      });
    }
  } catch (error) {
    console.warn('Account security email failed', {
      userId: input.userId,
      event: input.event,
      reason: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function signup({ name, email, password }: SignupInput) {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error('Nome é obrigatório');
  }

  if (!normalizedEmail) {
    throw new Error('E-mail é obrigatório');
  }

  if (!password.trim()) {
    throw new Error('Senha é obrigatória');
  }

  if (password.length < 6) {
    throw new Error('A senha deve ter pelo menos 6 caracteres');
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new Error('Já existe uma conta com este e-mail');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: trimmedName,
      email: normalizedEmail,
      passwordHash,
    },
  });

  const token = generateToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
}

export async function login({
  email,
  password,
  deviceName,
  platform,
  ipAddress,
}: LoginInput) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('E-mail é obrigatório');
  }

  if (!password.trim()) {
    throw new Error('Senha é obrigatória');
  }

  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail, deletedAt: null },
  });

  if (!user) {
    throw new Error('E-mail ou senha inválidos');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new Error('E-mail ou senha inválidos');
  }

  const session = await registerUserSession({
    userId: user.id,
    deviceName,
    platform,
    ipAddress,
  });

  const token = generateToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    sessionId: session.id,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
}

export async function changeEmail({
  userId,
  newEmail,
  currentPassword,
}: ChangeEmailInput) {
  const authenticatedUserId = requireAuthenticatedUserId(userId);
  const normalizedEmail = requireValidNewEmail(newEmail);
  const password = requireCurrentPassword(currentPassword);

  const user = await prisma.user.findUnique({
    where: {
      id: authenticatedUserId,
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    userNotFoundError();
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    invalidCurrentPasswordError();
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
    },
  });

  if (existingUser && existingUser.id !== user.id) {
    emailAlreadyInUseError();
  }

  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        email: normalizedEmail,
      },
      select: {
        id: true,
        email: true,
      },
    });

    logSettingsCredentialChange({
      userId: user.id,
      changeType: 'email',
    });

    await Promise.all([
      sendAccountSecurityEmailSafely({
        to: user.email,
        subject: 'Email da conta alterado',
        title: 'Email da conta alterado',
        body: `O email da sua conta foi alterado para ${updatedUser.email}.`,
        userId: user.id,
        event: 'email_changed_old_address',
      }),
      ...(user.email !== updatedUser.email
        ? [
            sendAccountSecurityEmailSafely({
              to: updatedUser.email,
              subject: 'Email da conta atualizado',
              title: 'Email da conta atualizado',
              body: 'Este email foi definido como o novo email da sua conta.',
              userId: user.id,
              event: 'email_changed_new_address',
            }),
          ]
        : []),
    ]);

    return {
      user: updatedUser,
    };
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      emailAlreadyInUseError();
    }

    if (error.code === 'P2025') {
      userNotFoundError();
    }

    throw error;
  }
}

export async function changePassword({
  userId,
  currentPassword,
  newPassword,
}: ChangePasswordInput) {
  const authenticatedUserId = requireAuthenticatedUserId(userId);
  const password = requireCurrentPassword(currentPassword);
  const nextPassword = requireValidNewPassword(newPassword);

  const user = await prisma.user.findUnique({
    where: {
      id: authenticatedUserId,
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    userNotFoundError();
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    invalidCurrentPasswordError();
  }

  const isSamePassword = await bcrypt.compare(nextPassword, user.passwordHash);

  if (isSamePassword) {
    samePasswordError();
  }

  const passwordHash = await bcrypt.hash(nextPassword, 10);

  try {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash,
      },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      userNotFoundError();
    }

    throw error;
  }

  logSettingsCredentialChange({
    userId: user.id,
    changeType: 'password',
  });

  await sendAccountSecurityEmailSafely({
    to: user.email,
    subject: 'Senha alterada com sucesso',
    title: 'Senha alterada com sucesso',
    body: 'A senha da sua conta foi alterada com sucesso.',
    userId: user.id,
    event: 'password_changed',
  });

  return {
    ok: true,
  };
}
