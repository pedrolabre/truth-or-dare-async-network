import { useCallback, useMemo, useState } from 'react';

import { uploadAppFile } from '../services/uploads';
import type {
  ActionProofDraft,
  ActionProofDraftInput,
  ActionProofMediaType,
} from '../types/action';
import type {
  ClubFeedItemApi,
  ClubPromptResponseApi,
  CreateClubPromptResponsePayloadApi,
} from '../types/clubsApi';

type UploadClubProofFile = typeof uploadAppFile;

type SubmitClubDareProofResponse = (
  payload: CreateClubPromptResponsePayloadApi,
) => Promise<ClubPromptResponseApi | null>;

type UseClubDareProofResponseOptions = {
  prompt: ClubFeedItemApi | null;
  submitResponse: SubmitClubDareProofResponse;
  uploadFile?: UploadClubProofFile;
};

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

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : 'Nao foi possivel enviar a prova do desafio.';
}

function isPromptExpired(prompt: ClubFeedItemApi | null) {
  if (!prompt?.expiresAt) {
    return false;
  }

  const expiresAt = new Date(prompt.expiresAt).getTime();

  return Number.isFinite(expiresAt) && expiresAt <= Date.now();
}

export function useClubDareProofResponse({
  prompt,
  submitResponse,
  uploadFile = uploadAppFile,
}: UseClubDareProofResponseOptions) {
  const [draftProof, setDraftProof] = useState<ActionProofDraft | null>(null);
  const [proofText, setProofText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(
      prompt &&
        prompt.type === 'dare' &&
        prompt.viewerState.canAnswer &&
        !prompt.viewerState.answeredByMe &&
        !isPromptExpired(prompt) &&
        draftProof?.localUri &&
        (draftProof.mediaType === 'video' ||
          draftProof.mediaType === 'audio' ||
          draftProof.mediaType === 'file') &&
        !isSubmitting,
    );
  }, [draftProof, isSubmitting, prompt]);

  const handleCaptureProof = useCallback(
    (
      proofInput:
        | Exclude<ActionProofMediaType, 'none'>
        | ActionProofDraftInput = 'video',
    ) => {
      setErrorMessage(null);
      setDraftProof((currentDraft) => {
        const previousText = proofText || currentDraft?.text || '';
        const nextDraft =
          typeof proofInput === 'string'
            ? createProofDraft({ mediaType: proofInput }, previousText)
            : createProofDraft(proofInput, previousText);

        return nextDraft;
      });
    },
    [proofText],
  );

  const handleUpdateProofText = useCallback((text: string) => {
    setProofText(text);
    setDraftProof((currentDraft) =>
      currentDraft
        ? {
            ...currentDraft,
            text,
          }
        : currentDraft,
    );
  }, []);

  const handleRemoveDraftProof = useCallback(() => {
    setDraftProof(null);
    setErrorMessage(null);
  }, []);

  const reset = useCallback(() => {
    setDraftProof(null);
    setProofText('');
    setErrorMessage(null);
    setIsSubmitting(false);
  }, []);

  const handleSubmitProof = useCallback(async () => {
    if (!prompt) {
      const message = 'Prompt de desafio nao identificado.';
      setErrorMessage(message);
      throw new Error(message);
    }

    if (
      prompt.type !== 'dare' ||
      !prompt.viewerState.canAnswer ||
      prompt.viewerState.answeredByMe ||
      isPromptExpired(prompt)
    ) {
      const message = 'Este desafio nao aceita envio de prova agora.';
      setErrorMessage(message);
      throw new Error(message);
    }

    if (!draftProof?.localUri || draftProof.mediaType === 'none') {
      const message = 'Selecione uma prova antes de enviar.';
      setErrorMessage(message);
      throw new Error(message);
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const uploadedFile = await uploadFile({
        localUri: draftProof.localUri,
        fileName: draftProof.fileName ?? 'club-proof-file',
        mimeType: getProofMimeType(draftProof),
        usage: 'comment-attachment',
        entityId: prompt.id,
      });

      const response = await submitResponse({
        text: proofText.trim() || null,
        mediaUrl: uploadedFile.fileUrl,
        mediaType: draftProof.mediaType,
        dareProofId: null,
      });

      setDraftProof((currentDraft) =>
        currentDraft
          ? {
              ...currentDraft,
              uploadedAt: new Date().toISOString(),
            }
          : currentDraft,
      );

      return response;
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [draftProof, prompt, proofText, submitResponse, uploadFile]);

  return {
    draftProof,
    proofText,
    canSubmit,
    isSubmitting,
    errorMessage,
    handleCaptureProof,
    handleUpdateProofText,
    handleRemoveDraftProof,
    handleSubmitProof,
    reset,
  };
}
