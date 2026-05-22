import { useCallback, useMemo, useState } from 'react';

import type {
  ClubPromptComposerPayload,
  ClubPromptComposerSubmit,
} from '../types/clubs';
import type { ClubPromptTypeApi } from '../types/clubsApi';

export const CLUB_PROMPT_CONTENT_MIN_LENGTH = 3;
export const CLUB_PROMPT_CONTENT_MAX_LENGTH = 500;
export const CLUB_PROMPT_DIFFICULTY_MAX_LENGTH = 32;
export const CLUB_PROMPT_MAX_ATTEMPTS = 50;

type UseClubPromptComposerOptions = {
  canPostPrompt: boolean;
  submitPrompt: ClubPromptComposerSubmit;
};

function getContentError(content: string) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return 'Escreva o prompt do clube.';
  }

  if (trimmedContent.length < CLUB_PROMPT_CONTENT_MIN_LENGTH) {
    return 'Use pelo menos 3 caracteres.';
  }

  if (content.length > CLUB_PROMPT_CONTENT_MAX_LENGTH) {
    return 'Use no maximo 500 caracteres.';
  }

  return null;
}

function getDifficultyError(difficulty: string) {
  if (difficulty.length > CLUB_PROMPT_DIFFICULTY_MAX_LENGTH) {
    return 'Use no maximo 32 caracteres.';
  }

  return null;
}

function getMaxAttemptsError(
  type: ClubPromptTypeApi,
  maxAttemptsText: string,
) {
  if (type !== 'dare' || !maxAttemptsText.trim()) {
    return null;
  }

  const maxAttempts = Number(maxAttemptsText);

  if (
    !Number.isInteger(maxAttempts) ||
    maxAttempts <= 0 ||
    maxAttempts > CLUB_PROMPT_MAX_ATTEMPTS
  ) {
    return 'Use um numero entre 1 e 50.';
  }

  return null;
}

function normalizeMaxAttempts(type: ClubPromptTypeApi, value: string) {
  if (type !== 'dare' || !value.trim()) {
    return null;
  }

  return Number(value);
}

export function useClubPromptComposer({
  canPostPrompt,
  submitPrompt,
}: UseClubPromptComposerOptions) {
  const [type, setType] = useState<ClubPromptTypeApi>('truth');
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [maxAttemptsText, setMaxAttemptsText] = useState('');
  const [isMembersOnly, setIsMembersOnly] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(
    null,
  );

  const contentError = useMemo(() => getContentError(content), [content]);
  const difficultyError = useMemo(
    () => getDifficultyError(difficulty),
    [difficulty],
  );
  const maxAttemptsError = useMemo(
    () => getMaxAttemptsError(type, maxAttemptsText),
    [maxAttemptsText, type],
  );
  const canSubmit =
    canPostPrompt &&
    !isSubmitting &&
    contentError === null &&
    difficultyError === null &&
    maxAttemptsError === null;

  const reset = useCallback(() => {
    setType('truth');
    setContent('');
    setDifficulty('');
    setMaxAttemptsText('');
    setIsMembersOnly(true);
    setSubmitErrorMessage(null);
    setIsSubmitting(false);
  }, []);

  const buildPayload = useCallback((): ClubPromptComposerPayload => {
    const trimmedDifficulty = difficulty.trim();

    return {
      type,
      content: content.trim(),
      difficulty: trimmedDifficulty ? trimmedDifficulty : null,
      maxAttempts: normalizeMaxAttempts(type, maxAttemptsText),
      expiresAt: null,
      isMembersOnly,
    };
  }, [content, difficulty, isMembersOnly, maxAttemptsText, type]);

  async function handleSubmit() {
    if (!canSubmit) {
      return null;
    }

    setIsSubmitting(true);
    setSubmitErrorMessage(null);

    try {
      const prompt = await submitPrompt(buildPayload());

      if (prompt) {
        reset();
      }

      return prompt;
    } catch (error) {
      setSubmitErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : 'Nao foi possivel postar o prompt.',
      );
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleMembersOnly() {
    setIsMembersOnly((current) => !current);
  }

  return {
    type,
    content,
    difficulty,
    maxAttemptsText,
    isMembersOnly,
    isSubmitting,
    submitErrorMessage,
    contentError,
    difficultyError,
    maxAttemptsError,
    contentCharacterCount: content.length,
    contentMaxLength: CLUB_PROMPT_CONTENT_MAX_LENGTH,
    canSubmit,
    setType,
    setContent,
    setDifficulty,
    setMaxAttemptsText,
    setIsMembersOnly,
    toggleMembersOnly,
    buildPayload,
    handleSubmit,
    reset,
  };
}
