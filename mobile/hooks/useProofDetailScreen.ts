import { useCallback, useEffect, useMemo, useState } from 'react';

import { getDareProof } from '../services/api';
import { loadCachedResource } from '../services/cachedApi';
import { LOCAL_CACHE_KEYS, LOCAL_CACHE_TTLS } from '../services/cache';
import type {
  DareProofDetailsResponse,
  ProofDetailItem,
  ProofDetailState,
  ProofMediaType,
} from '../types/proof';

type ProofDetailParamValue = string | string[] | undefined;

type ProofDetailRouteParams = {
  proofId?: ProofDetailParamValue;
  dareId?: ProofDetailParamValue;
  title?: ProofDetailParamValue;
  challenger?: ProofDetailParamValue;
  mediaType?: ProofDetailParamValue;
  localUri?: ProofDetailParamValue;
  fileName?: ProofDetailParamValue;
  durationSeconds?: ProofDetailParamValue;
  text?: ProofDetailParamValue;
  source?: ProofDetailParamValue;
};

type LoadDareProof = (proofId: string) => Promise<DareProofDetailsResponse>;

type ProofDetailContentState = ProofDetailState['contentState'];

type UseProofDetailScreenOptions = {
  loadDareProof?: LoadDareProof;
};

function getParamValue(value: ProofDetailParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
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

function isImageFile(fileName?: string | null, uri?: string | null) {
  const source = `${fileName ?? ''} ${uri ?? ''}`.toLowerCase();

  return (
    source.includes('.jpg') ||
    source.includes('.jpeg') ||
    source.includes('.png') ||
    source.includes('.webp')
  );
}

function normalizeMediaType(
  mediaType?: string | null,
  fileName?: string | null,
  uri?: string | null,
): ProofMediaType {
  if (mediaType === 'image') {
    return 'image';
  }

  if (mediaType === 'video' || mediaType === 'audio') {
    return mediaType;
  }

  if (isImageFile(fileName, uri)) {
    return 'image';
  }

  return 'file';
}

function formatDateLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const pad = (part: number) => String(part).padStart(2, '0');

  return [
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join(' ');
}

function getNumberParam(value: ProofDetailParamValue): number | null {
  const rawValue = getParamValue(value);

  if (!rawValue) {
    return null;
  }

  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function createLocalProof(params?: ProofDetailRouteParams): ProofDetailItem {
  const localUri = getParamValue(params?.localUri) ?? null;
  const fileName = getParamValue(params?.fileName) ?? null;
  const mediaType = normalizeMediaType(
    getParamValue(params?.mediaType),
    fileName,
    localUri,
  );
  const challenger = getParamValue(params?.challenger) ?? 'Autor nao informado';
  const title = getParamValue(params?.title) ?? 'Desafio';
  const proofId = getParamValue(params?.proofId) ?? 'proof-draft-local';
  const dareId = getParamValue(params?.dareId) ?? 'dare-local';
  const description = getParamValue(params?.text)?.trim();

  return {
    id: proofId,
    challengeId: dareId,
    challengeType: 'dare',
    author: {
      id: 'local-user',
      name: challenger,
      initials: getInitials(challenger),
      avatarUrl: null,
    },
    createdAtLabel: 'Rascunho local',
    mediaType,
    mediaUri: localUri,
    thumbnailUri: mediaType === 'image' ? localUri : null,
    durationSeconds: getNumberParam(params?.durationSeconds),
    description:
      description || 'Nenhum texto foi adicionado. O comentario da prova e opcional.',
    likedByMe: false,
    likesCount: 0,
    commentsCount: 0,
    isOwnProof: true,
    relatedChallenge: {
      id: dareId,
      type: 'dare',
      title,
      statusLabel: 'Rascunho local',
    },
  };
}

function mapBackendProofToDetail(
  response: DareProofDetailsResponse,
): ProofDetailItem {
  const mediaType = normalizeMediaType(
    response.mediaType,
    response.fileUrl,
    response.fileUrl,
  );

  return {
    id: response.id,
    challengeId: response.dareId,
    challengeType: 'dare',
    author: {
      id: response.author.id,
      name: response.author.name,
      initials: getInitials(response.author.name),
      avatarUrl: response.author.avatarUrl,
    },
    createdAtLabel: formatDateLabel(response.createdAt),
    mediaType,
    mediaUri: response.fileUrl,
    thumbnailUri: mediaType === 'image' ? response.fileUrl : null,
    durationSeconds: response.durationSeconds,
    description: response.text?.trim() || 'Prova sem texto adicional.',
    likedByMe: false,
    likesCount: 0,
    commentsCount: 0,
    isOwnProof: false,
    relatedChallenge: {
      id: response.dare.id,
      type: 'dare',
      title: response.dare.content,
      statusLabel: response.dare.completedAt
        ? 'Desafio concluido'
        : 'Prova enviada',
    },
  };
}

function getErrorStatus(error: unknown): number | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
  ) {
    return error.status;
  }

  return null;
}

function getErrorContentState(error: unknown): ProofDetailContentState {
  const status = getErrorStatus(error);

  if (status === 403) {
    return 'access-denied';
  }

  if (status === 404 || status === 410) {
    return 'not-found';
  }

  return 'error';
}

function getErrorMessage(error: unknown, state: ProofDetailContentState) {
  if (state === 'access-denied') {
    return 'Voce nao tem permissao para visualizar esta prova.';
  }

  if (state === 'not-found') {
    return 'Esta prova foi removida ou nao existe mais.';
  }

  return error instanceof Error && error.message
    ? error.message
    : 'Nao foi possivel carregar esta prova.';
}

function shouldLoadBackendProof(proofId: string | undefined, source: string) {
  if (source === 'local-draft') {
    return false;
  }

  return source === 'backend' || Boolean(proofId && proofId !== 'proof-draft-local');
}

export function useProofDetailScreen(
  params?: ProofDetailRouteParams,
  { loadDareProof = getDareProof }: UseProofDetailScreenOptions = {},
) {
  const proofId = getParamValue(params?.proofId);
  const source = getParamValue(params?.source) ?? '';
  const dareId = getParamValue(params?.dareId);
  const title = getParamValue(params?.title);
  const challenger = getParamValue(params?.challenger);
  const mediaType = getParamValue(params?.mediaType);
  const localUri = getParamValue(params?.localUri);
  const fileName = getParamValue(params?.fileName);
  const durationSeconds = getParamValue(params?.durationSeconds);
  const text = getParamValue(params?.text);
  const localParams = useMemo<ProofDetailRouteParams>(
    () => ({
      proofId,
      dareId,
      title,
      challenger,
      mediaType,
      localUri,
      fileName,
      durationSeconds,
      text,
      source,
    }),
    [
      challenger,
      dareId,
      durationSeconds,
      fileName,
      localUri,
      mediaType,
      proofId,
      source,
      text,
      title,
    ],
  );
  const [proof, setProof] = useState<ProofDetailItem>(() =>
    createLocalProof(localParams),
  );
  const [contentState, setContentState] = useState<ProofDetailContentState>(
    shouldLoadBackendProof(proofId, source) ? 'loading' : 'local-draft',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  const loadProof = useCallback(async () => {
    const shouldLoadBackend = shouldLoadBackendProof(proofId, source);

    if (!shouldLoadBackend) {
      setProof(createLocalProof(localParams));
      setContentState('local-draft');
      setErrorMessage(null);
      setIsFromCache(false);
      setSyncErrorMessage(null);
      return;
    }

    if (!proofId) {
      setContentState('error');
      setErrorMessage('Prova nao identificada.');
      setIsFromCache(false);
      setSyncErrorMessage(null);
      return;
    }

    setContentState('loading');
    setErrorMessage(null);
    setSyncErrorMessage(null);

    try {
      const result = await loadCachedResource<DareProofDetailsResponse>({
        key: LOCAL_CACHE_KEYS.proofDetails(proofId),
        ttlMs: LOCAL_CACHE_TTLS.proofDetails,
        fetcher: () => loadDareProof(proofId),
        fallbackSyncErrorMessage:
          'Nao foi possivel sincronizar esta prova agora.',
        onCacheHit: ({ record }) => {
          setProof(mapBackendProofToDetail(record.value));
          setContentState('ready');
          setErrorMessage(null);
          setIsFromCache(true);
        },
      });

      setProof(mapBackendProofToDetail(result.value));
      setContentState('ready');
      setErrorMessage(null);
      setIsFromCache(result.isFromCache);
      setSyncErrorMessage(result.syncErrorMessage);
    } catch (error) {
      const nextState = getErrorContentState(error);

      setContentState(nextState);
      setErrorMessage(getErrorMessage(error, nextState));
      setIsFromCache(false);
      setSyncErrorMessage(null);
    }
  }, [loadDareProof, localParams, proofId, source]);

  useEffect(() => {
    void loadProof();
  }, [loadProof]);

  const state = useMemo<ProofDetailState>(() => {
    const isVideo = proof.mediaType === 'video';
    const isAudio = proof.mediaType === 'audio';
    const isImage = proof.mediaType === 'image';
    const hasMedia = Boolean(proof.mediaUri || proof.thumbnailUri);
    const canDelete = proof.isOwnProof;
    const primaryActionLabel = proof.isOwnProof ? 'Postar prova' : 'Compartilhar';

    return {
      proof,
      isVideo,
      isAudio,
      isImage,
      hasMedia,
      canDelete,
      primaryActionLabel,
      contentState,
      errorMessage,
      isFromCache,
      syncErrorMessage,
    };
  }, [contentState, errorMessage, isFromCache, proof, syncErrorMessage]);

  function handleToggleLike() {
    setProof((current) => {
      const nextLiked = !current.likedByMe;

      return {
        ...current,
        likedByMe: nextLiked,
        likesCount: nextLiked
          ? current.likesCount + 1
          : Math.max(current.likesCount - 1, 0),
      };
    });
  }

  function handleDeleteProof() {
    setProof((current) => ({
      ...current,
      description: 'Esta prova foi removida localmente.',
      thumbnailUri: null,
      mediaUri: null,
      likesCount: 0,
      commentsCount: 0,
    }));
  }

  function handlePostProof() {
    setProof((current) => ({
      ...current,
      relatedChallenge: {
        ...current.relatedChallenge,
        statusLabel: 'Prova publicada',
      },
    }));
  }

  return {
    proof,
    state,
    contentState,
    errorMessage,
    handleRetry: loadProof,
    handleToggleLike,
    handleDeleteProof,
    handlePostProof,
  };
}
