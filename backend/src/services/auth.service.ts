import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { generateToken } from '../utils/jwt';

type SignupInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

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

export async function login({ email, password }: LoginInput) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('E-mail é obrigatório');
  }

  if (!password.trim()) {
    throw new Error('Senha é obrigatória');
  }

  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new Error('E-mail ou senha inválidos');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new Error('E-mail ou senha inválidos');
  }

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