import { useMemo, useState } from 'react';

import { submitDareProof } from '../services/api';
import { uploadAppFile } from '../services/uploads';
import type {
  ActionChallenge,
  ActionChallengeStatus,
  ActionParamValue,
  ActionProofDraft,
  ActionProofDraftInput,
  ActionProofMediaType,
  ActionScreenParams,
  ActionScreenState,
  SubmitDareProofPayload,
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

function createProofDraft(
  proofInput: ActionProofDraftInput,
  previousText = '',
): ActionProofDraft {
  return {
    id: null,
    mediaType: proofInput.mediaType,
    localUri: proofInput.localUri ?? null,
    durationSeconds: proofInput.durationSeconds ?? null,
    fileName: proofInput.fileName ?? null,
    text: previousText,
    uploadedAt: null,
  };
}

function createEmptyProofDraft(
  mediaType: Exclude<ActionProofMediaType, 'none'>,
  previousText = '',
): ActionProofDraft {
  return createProofDraft({ mediaType }, previousText);
}

function getProgressValue(challenge: ActionChallenge) {
  if (!challenge.maxAttempts || challenge.maxAttempts <= 0) {
    return 0;
  }

  const used = challenge.attemptsUsed ?? 0;

  return Math.min(used / challenge.maxAttempts, 1);
}

function getProofMimeType(draftProof: ActionProofDraft) {
  const fileName = draftProof.fileName?.toLowerCase() ?? '';
  const localUri = draftProof.localUri?.toLowerCase() ?? '';
  const source = fileName || localUri;

  if (draftProof.mediaType === 'video') {
    if (source.endsWith('.mov')) {
      return 'video/quicktime';
    }

    if (source.endsWith('.webm')) {
      return 'video/webm';
    }

    return 'video/mp4';
  }

  if (draftProof.mediaType === 'audio') {
    if (source.endsWith('.mp3')) {
      return 'audio/mpeg';
    }

    if (source.endsWith('.wav')) {
      return 'audio/wav';
    }

    if (source.endsWith('.m4a')) {
      return 'audio/mp4';
    }

    return 'audio/mpeg';
  }

  if (source.endsWith('.png')) {
    return 'image/png';
  }

  if (source.endsWith('.jpg') || source.endsWith('.jpeg')) {
    return 'image/jpeg';
  }

  if (source.endsWith('.pdf')) {
    return 'application/pdf';
  }

  return 'application/octet-stream';
}

export function useActionScreen(params?: ActionScreenParams) {
  const [challenge, setChallenge] = useState<ActionChallenge>(() =>
    createDareActionFromParams(params),
  );
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [submitProofError, setSubmitProofError] = useState<string | null>(null);
  const [submitProofSuccessMessage, setSubmitProofSuccessMessage] = useState<
    string | null
  >(null);

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
    proofInput:
      | Exclude<ActionProofMediaType, 'none'>
      | ActionProofDraftInput = 'video',
  ) {
    setChallenge((current) => {
      const previousText = current.draftProof?.text ?? '';

      const draftProof =
        typeof proofInput === 'string'
          ? createEmptyProofDraft(proofInput, previousText)
          : createProofDraft(proofInput, previousText);

      return {
        ...current,
        draftProof,
      };
    });
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

    setSubmitProofError(null);
    setSubmitProofSuccessMessage(null);

    if (!draftProof || draftProof.mediaType === 'none') {
      const message = 'Selecione uma prova antes de enviar.';
      setSubmitProofError(message);
      throw new Error(message);
    }

        const localUri = draftProof.localUri?.trim();

    if (!localUri) {
      const message =
        'A prova ainda não possui um arquivo selecionado. Grave ou selecione uma mídia antes de enviar.';
      setSubmitProofError(message);
      throw new Error(message);
    }

    setIsSubmittingProof(true);

    try {
      const uploadedFile = await uploadAppFile({
        localUri,
        fileName: draftProof.fileName ?? 'proof-file',
        mimeType: getProofMimeType(draftProof),
        usage: 'dare-proof',
        entityId: challenge.id,
      });

      const payload: SubmitDareProofPayload = {
        mediaType: draftProof.mediaType,
        fileUrl: uploadedFile.fileUrl,
        durationSeconds: draftProof.durationSeconds ?? null,
        text: draftProof.text?.trim() ?? '',
      };

      await submitDareProof(challenge.id, payload);

      setChallenge((current) => ({
        ...current,
        status: 'concluded',
        completedAt: new Date().toISOString(),
        existingProofCount: Math.max(current.existingProofCount, 1),
        primaryActionLabel: 'Prova enviada',
        draftProof: current.draftProof
          ? {
              ...current.draftProof,
              uploadedAt: new Date().toISOString(),
            }
          : current.draftProof,
      }));

      setSubmitProofSuccessMessage('Prova enviada com sucesso.');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar a prova.';

      setSubmitProofError(message);
      throw error;
    } finally {
      setIsSubmittingProof(false);
    }
  }

  function handleResetLocalState() {
    setChallenge(createDareActionFromParams(params));
  }

    return {
    challenge,
    state,
    isSubmittingProof,
    submitProofError,
    submitProofSuccessMessage,
    handleCaptureProof,
    handleUpdateProofText,
    handleRemoveDraftProof,
    handleSubmitProof,
    handleResetLocalState,
  };
}