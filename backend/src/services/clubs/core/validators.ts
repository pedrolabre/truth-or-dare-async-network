import { ClubVisibility } from '../../../generated/prisma/client';
import { validationError } from './errors';

export const CLUB_DESCRIPTION_MAX_LENGTH = 280;
export const CLUB_RULES_MAX_LENGTH = 2000;

const CLUB_NAME_MIN_LENGTH = 3;
const CLUB_NAME_MAX_LENGTH = 80;
const CLUB_TAG_MAX_LENGTH = 32;
const CLUB_BLOCKED_WORD_MAX_LENGTH = 40;
const CLUB_MAX_TAGS = 10;
const CLUB_MAX_BLOCKED_WORDS = 100;
const CLUB_MAX_INITIAL_MEMBERS = 50;

const ALLOWED_ICON_NAMES = new Set([
  'groups',
  'sports-esports',
  'local-fire-department',
  'auto-awesome',
  'celebration',
  'school',
  'nightlife',
  'favorite',
]);

export function normalizeName(value: unknown) {
  if (typeof value !== 'string') {
    validationError('Nome do clube e obrigatorio');
  }

  const name = value.trim();

  if (
    name.length < CLUB_NAME_MIN_LENGTH ||
    name.length > CLUB_NAME_MAX_LENGTH
  ) {
    validationError(
      `Nome do clube deve ter entre ${CLUB_NAME_MIN_LENGTH} e ${CLUB_NAME_MAX_LENGTH} caracteres`,
    );
  }

  return name;
}

export function normalizeOptionalText(
  value: unknown,
  fieldName: string,
  maxLength: number,
) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    validationError(`${fieldName} deve ser texto`);
  }

  const text = value.trim();

  if (text.length > maxLength) {
    validationError(`${fieldName} deve ter no maximo ${maxLength} caracteres`);
  }

  return text || null;
}

export function normalizeIconName(value: unknown) {
  const iconName = value === undefined ? 'groups' : value;

  if (typeof iconName !== 'string' || !ALLOWED_ICON_NAMES.has(iconName)) {
    validationError('Icone de clube invalido');
  }

  return iconName;
}

export function normalizeVisibility(value: unknown) {
  const visibility = value === undefined ? ClubVisibility.public : value;

  if (
    visibility !== ClubVisibility.public &&
    visibility !== ClubVisibility.private &&
    visibility !== ClubVisibility.invite_only
  ) {
    validationError('Privacidade de clube invalida');
  }

  return visibility;
}

export function normalizeInitialMemberIds(value: unknown, creatorId: string) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    validationError('Lista de membros iniciais invalida');
  }

  if (value.length > CLUB_MAX_INITIAL_MEMBERS) {
    validationError(
      `Lista de membros iniciais deve ter no maximo ${CLUB_MAX_INITIAL_MEMBERS} usuarios`,
    );
  }

  const normalizedIds = value.map((memberId) => {
    if (typeof memberId !== 'string' || !memberId.trim()) {
      validationError('Lista de membros iniciais invalida');
    }

    return memberId.trim();
  });

  if (normalizedIds.includes(creatorId)) {
    validationError('Criador nao pode ser adicionado como membro inicial');
  }

  if (new Set(normalizedIds).size !== normalizedIds.length) {
    validationError('Lista de membros iniciais possui duplicatas');
  }

  return normalizedIds;
}

export function normalizeTags(value: unknown) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    validationError('Tags do clube invalidas');
  }

  const tags = value.map((tag) => {
    if (typeof tag !== 'string') {
      validationError('Tags do clube invalidas');
    }

    const normalizedTag = tag.trim().toLowerCase();

    if (!normalizedTag || normalizedTag.length > CLUB_TAG_MAX_LENGTH) {
      validationError(
        `Tags devem ter entre 1 e ${CLUB_TAG_MAX_LENGTH} caracteres`,
      );
    }

    return normalizedTag;
  });

  const uniqueTags = Array.from(new Set(tags));

  if (uniqueTags.length !== tags.length) {
    validationError('Tags do clube possuem duplicatas');
  }

  if (uniqueTags.length > CLUB_MAX_TAGS) {
    validationError(`Clube deve ter no maximo ${CLUB_MAX_TAGS} tags`);
  }

  return uniqueTags;
}

export function normalizeBlockedWords(value: unknown) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    validationError('Palavras bloqueadas do clube invalidas');
  }

  const blockedWords = value.map((word) => {
    if (typeof word !== 'string') {
      validationError('Palavras bloqueadas do clube invalidas');
    }

    const normalizedWord = word.trim().toLowerCase();

    if (
      !normalizedWord ||
      normalizedWord.length > CLUB_BLOCKED_WORD_MAX_LENGTH
    ) {
      validationError(
        `Palavras bloqueadas devem ter entre 1 e ${CLUB_BLOCKED_WORD_MAX_LENGTH} caracteres`,
      );
    }

    return normalizedWord;
  });

  const uniqueBlockedWords = Array.from(new Set(blockedWords));

  if (uniqueBlockedWords.length !== blockedWords.length) {
    validationError('Palavras bloqueadas do clube possuem duplicatas');
  }

  if (uniqueBlockedWords.length > CLUB_MAX_BLOCKED_WORDS) {
    validationError(
      `Clube deve ter no maximo ${CLUB_MAX_BLOCKED_WORDS} palavras bloqueadas`,
    );
  }

  return uniqueBlockedWords;
}
