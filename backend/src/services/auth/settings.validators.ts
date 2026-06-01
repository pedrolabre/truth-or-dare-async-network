import {
  passwordTooWeakError,
  validationError,
} from './settings.errors';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_ACCOUNT_PASSWORD_LENGTH = 8;

export function requireAuthenticatedUserId(input: unknown): string {
  if (typeof input !== 'string' || !input.trim()) {
    validationError('Usuario autenticado nao informado');
  }

  return input;
}

export function requireValidNewEmail(input: unknown): string {
  if (typeof input !== 'string') {
    validationError('Novo e-mail invalido');
  }

  const normalizedEmail = input.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    validationError('Novo e-mail invalido');
  }

  return normalizedEmail;
}

export function requireCurrentPassword(input: unknown): string {
  if (typeof input !== 'string' || !input) {
    validationError('Senha atual e obrigatoria');
  }

  return input;
}

export function requireValidNewPassword(input: unknown): string {
  if (
    typeof input !== 'string' ||
    input.length < MIN_ACCOUNT_PASSWORD_LENGTH
  ) {
    passwordTooWeakError();
  }

  return input;
}
