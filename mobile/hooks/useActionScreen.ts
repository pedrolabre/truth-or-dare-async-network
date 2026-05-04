import { useMemo, useState } from 'react';

import { submitDareProof } from '../services/api';
import type {
  ActionChallenge,
  ActionChallengeStatus,
  ActionParamValue,
  ActionProofDraft,
  ActionProofMediaType,
  ActionScreenParams,
  ActionScreenState,
  SubmitProofPayload,
} from '../types/action';

function getParamValue(value: ActionParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getNumberParam(value: ActionParamValue): number | undefined {
  const rawValue = getParamValue(value);

  if (!rawValue) {
    return undefined;
  }

  const parsedValue = Number(rawValue);

  if (Number.isNaN(parsedValue)) {
    return undefined;
  }

  return parsedValue;
}

function getNullableNumberParam(value: ActionParamValue): number | null {
  const parsedValue = getNumberParam(value);

  return parsedValue ?? null;
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return '??';
  }

  return parts.map((part) => part[0]?.toUpperCase()).join('');
}

function resolveStatus(value: ActionParamValue): ActionChallengeStatus {
  const status = getParamValue(value);

  if (
    status === 'active' ||
    status === 'submitted' ||
    status === 'concluded' ||
    status === 'failed' ||
    status === 'expired'
  ) {
    return status;
  }

  return 'active';
}

function createDareActionFromParams(params?: ActionScreenParams): ActionChallenge {
  const dareId =
    getParamValue(params?.dareId) ??
    getParamValue(params?.challengeId) ??
    'dare-unavailable';

  const title = getParamValue(params?.title) ?? 'Desafio indisponível';
  const challenger = getParamValue(params?.challenger) ?? 'Autor não informado';
  const expiresIn = getParamValue(params?.expiresIn) ?? null;
  const expiresAt = getParamValue(params?.expiresAt) ?? null;

  return {
    id: dareId,
    type: 'dare',
    title,
    description:
      'Envie uma prova em vídeo, áudio ou arquivo para cumprir este desafio. O texto é opcional.',
    creatorName: challenger,
    creatorInitials: getInitials(challenger),
    createdAtLabel: '',
    participants: [
      {
        id: 'challenger',
        name: challenger,
        initials: getInitials(challenger),
      },
    ],
    status: resolveStatus(params?.status),
    attemptsUsed: getNumberParam(params?.attemptsUsed) ?? 0,
    maxAttempts: getNullableNumberParam(params?.maxAttempts),
    expiresAtLabel: expiresAt,
    timeRemainingLabel: expiresIn,
    proofRequired: true,
    proofCtaLabel: 'Adicionar prova',
    primaryActionLabel: 'Enviar prova',
    secondaryActionLabel: 'Visualizar prova',
    existingProofCount: 0,
    draftProof: null,
  };
}

function createEmptyProofDraft(
  mediaType: Exclude<ActionProofMediaType, 'none'>,
  previousText = '',
): ActionProofDraft {
  return {
    id: null,
    mediaType,
    localUri: null,
    durationSeconds: null,
    fileName: null,
    text: previousText,
    uploadedAt: null,
  };
}

function getProgressValue(challenge: ActionChallenge) {
  if (!challenge.maxAttempts || challenge.maxAttempts <= 0) {
    return 0;
  }

  const used = challenge.attemptsUsed ?? 0;

  return Math.min(used / challenge.maxAttempts, 1);
}

export function useActionScreen(params?: ActionScreenParams) {
  const [challenge, setChallenge] = useState<ActionChallenge>(() =>
    createDareActionFromParams(params),
  );

  const state = useMemo<ActionScreenState>(() => {
    const isExpired = challenge.status === 'expired';
    const isCompleted =
      challenge.status === 'concluded' || challenge.status === 'submitted';

    const hasRequiredMedia =
      challenge.draftProof?.mediaType === 'video' ||
      challenge.draftProof?.mediaType === 'audio' ||
      challenge.draftProof?.mediaType === 'file';

    const canSubmitProof =
      challenge.proofRequired &&
      hasRequiredMedia &&
      !isExpired &&
      challenge.status !== 'failed' &&
      challenge.status !== 'concluded' &&
      challenge.status !== 'submitted';

    const canOpenProofPreview =
      !!challenge.draftProof || challenge.existingProofCount > 0;

    return {
      challenge,
      canSubmitProof,
      canOpenProofPreview,
      isExpired,
      isCompleted,
      progressValue: getProgressValue(challenge),
    };
  }, [challenge]);

  function handleCaptureProof(
    mediaType: Exclude<ActionProofMediaType, 'none'> = 'video',
  ) {
    setChallenge((current) => ({
      ...current,
      draftProof: createEmptyProofDraft(
        mediaType,
        current.draftProof?.text ?? '',
      ),
    }));
  }

  function handleUpdateProofText(text: string) {
    setChallenge((current) => ({
      ...current,
      draftProof: current.draftProof
        ? {
            ...current.draftProof,
            text,
          }
        : createEmptyProofDraft('file', text),
    }));
  }

  function handleRemoveDraftProof() {
    setChallenge((current) => ({
      ...current,
      draftProof: null,
    }));
  }

  async function handleSubmitProof() {
    const draftProof = challenge.draftProof;

    if (!draftProof || draftProof.mediaType === 'none') {
      throw new Error('Selecione uma prova antes de enviar.');
    }

    const payload: SubmitProofPayload = {
      challengeId: challenge.id,
      mediaType: draftProof.mediaType,
      localUri: draftProof.localUri ?? null,
      fileName: draftProof.fileName ?? null,
      durationSeconds: draftProof.durationSeconds ?? null,
      text: draftProof.text ?? '',
    };

    await submitDareProof(payload);
  }

  function handleResetLocalState() {
    setChallenge(createDareActionFromParams(params));
  }

  return {
    challenge,
    state,
    handleCaptureProof,
    handleUpdateProofText,
    handleRemoveDraftProof,
    handleSubmitProof,
    handleResetLocalState,
  };
}