import { ClubPromptType, Prisma } from '../generated/prisma/client';
import { validationError } from './clubs.errors';

const CLUB_PROMPT_CONTENT_MIN_LENGTH = 3;
const CLUB_PROMPT_CONTENT_MAX_LENGTH = 500;
const CLUB_PROMPT_MAX_ATTACHMENTS = 5;
const CLUB_PROMPT_DIFFICULTY_MAX_LENGTH = 32;

export function normalizePromptType(value: unknown) {
  if (value !== ClubPromptType.truth && value !== ClubPromptType.dare) {
    validationError('Tipo de prompt invalido');
  }

  return value;
}

export function normalizeContent(value: unknown) {
  if (typeof value !== 'string') {
    validationError('Conteudo do prompt e obrigatorio');
  }

  const content = value.trim();

  if (
    content.length < CLUB_PROMPT_CONTENT_MIN_LENGTH ||
    content.length > CLUB_PROMPT_CONTENT_MAX_LENGTH
  ) {
    validationError(
      `Conteudo do prompt deve ter entre ${CLUB_PROMPT_CONTENT_MIN_LENGTH} e ${CLUB_PROMPT_CONTENT_MAX_LENGTH} caracteres`,
    );
  }

  return content;
}

export function normalizeMaxAttempts(value: unknown, type: ClubPromptType) {
  if (type === ClubPromptType.truth) {
    return null;
  }

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0 || value > 50) {
    validationError('Maximo de tentativas deve ser um inteiro entre 1 e 50');
  }

  return value;
}

export function normalizeOptionalDate(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string' && !(value instanceof Date)) {
    validationError('Prazo do prompt invalido');
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    validationError('Prazo do prompt invalido');
  }

  if (date.getTime() <= Date.now()) {
    validationError('Prazo do prompt deve ser futuro');
  }

  return date;
}

export function normalizeDifficulty(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    validationError('Dificuldade do prompt deve ser texto');
  }

  const difficulty = value.trim();

  if (!difficulty) {
    return null;
  }

  if (difficulty.length > CLUB_PROMPT_DIFFICULTY_MAX_LENGTH) {
    validationError(
      `Dificuldade do prompt deve ter no maximo ${CLUB_PROMPT_DIFFICULTY_MAX_LENGTH} caracteres`,
    );
  }

  return difficulty;
}

export function normalizeAttachments(value: unknown): Prisma.InputJsonValue | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Array.isArray(value)) {
    validationError('Anexos do prompt devem ser uma lista');
  }

  if (value.length > CLUB_PROMPT_MAX_ATTACHMENTS) {
    validationError(
      `Prompt deve ter no maximo ${CLUB_PROMPT_MAX_ATTACHMENTS} anexos`,
    );
  }

  value.forEach((attachment) => {
    if (!attachment || typeof attachment !== 'object' || Array.isArray(attachment)) {
      validationError('Anexo do prompt invalido');
    }

    const candidate = attachment as Record<string, unknown>;

    if (typeof candidate.type !== 'string' || typeof candidate.url !== 'string') {
      validationError('Anexo do prompt deve ter tipo e url');
    }

    if (!candidate.type.trim() || !candidate.url.trim()) {
      validationError('Anexo do prompt deve ter tipo e url');
    }
  });

  return value as Prisma.InputJsonValue;
}

export function normalizeBoolean(value: unknown, defaultValue: boolean) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value !== 'boolean') {
    validationError('Campo booleano invalido');
  }

  return value;
}
