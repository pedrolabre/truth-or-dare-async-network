import { useMemo, useState } from 'react';

import type {
  ProofDetailItem,
  ProofDetailParams,
  ProofDetailState,
} from '../types/proof';

function createMockProof(params?: ProofDetailParams): ProofDetailItem {
  return {
    id: params?.proofId ?? 'proof-1',
    challengeId: 'dare-1',
    challengeType: 'dare',
    author: {
      id: 'user-1',
      name: 'Pedro Labre',
      initials: 'PL',
      avatarUrl: null,
    },
    createdAtLabel: 'há 12 min',
    mediaType: 'video',
    mediaUri: null,
    thumbnailUri: null,
    durationSeconds: 18,
    description:
      'Prova gravada para mostrar que o desafio foi concluído. Aqui vamos manter a estrutura pronta para futura integração com vídeo/imagem real, likes e comentários vindos do backend.',
    likedByMe: false,
    likesCount: 14,
    commentsCount: 3,
    isOwnProof: true,
    relatedChallenge: {
      id: 'dare-1',
      type: 'dare',
      title: 'Grave um vídeo provando que cumpriu o desafio.',
      statusLabel: 'Prova em revisão',
    },
  };
}

export function useProofDetailScreen(params?: ProofDetailParams) {
  const [proof, setProof] = useState<ProofDetailItem>(() => createMockProof(params));

  const state = useMemo<ProofDetailState>(() => {
    const isVideo = proof.mediaType === 'video';
    const hasMedia = !!proof.mediaUri || !!proof.thumbnailUri || proof.mediaType === 'video';
    const canDelete = proof.isOwnProof;
    const primaryActionLabel = proof.isOwnProof ? 'Postar prova' : 'Compartilhar';

    return {
      proof,
      isVideo,
      hasMedia,
      canDelete,
      primaryActionLabel,
    };
  }, [proof]);

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
      description: 'Esta prova foi removida localmente do mock.',
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
    handleToggleLike,
    handleDeleteProof,
    handlePostProof,
  };
}