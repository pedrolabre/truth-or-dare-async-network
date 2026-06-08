import { renderHook, waitFor } from '@testing-library/react-native';

import { useProofDetailScreen } from '../hooks/useProofDetailScreen';
import type { DareProofDetailsResponse } from '../types/proof';

function makeProofResponse(
  overrides: Partial<DareProofDetailsResponse> = {},
): DareProofDetailsResponse {
  return {
    id: 'proof-1',
    dareId: 'dare-1',
    userId: 'user-1',
    mediaType: 'video',
    fileUrl: 'https://cdn.example.com/proof.mp4',
    durationSeconds: 18,
    text: 'Prova real enviada.',
    createdAt: '2026-06-08T12:00:00.000Z',
    author: {
      id: 'user-1',
      name: 'Ana Souza',
      username: 'ana',
      avatarUrl: 'https://cdn.example.com/avatar.jpg',
    },
    dare: {
      id: 'dare-1',
      content: 'Grave uma prova do desafio.',
      authorId: 'author-1',
      targetUserId: 'user-1',
      completedAt: '2026-06-08T12:10:00.000Z',
    },
    ...overrides,
  };
}

function makeApiError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

describe('proof detail real media', () => {
  it('busca prova no backend quando source=backend e mapeia video real', async () => {
    const loadDareProof = jest.fn().mockResolvedValue(makeProofResponse());

    const { result } = renderHook(() =>
      useProofDetailScreen(
        {
          proofId: 'proof-1',
          source: 'backend',
        },
        { loadDareProof },
      ),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    expect(loadDareProof).toHaveBeenCalledWith('proof-1');
    expect(result.current.proof.mediaType).toBe('video');
    expect(result.current.proof.mediaUri).toBe('https://cdn.example.com/proof.mp4');
    expect(result.current.state.isVideo).toBe(true);
    expect(result.current.state.hasMedia).toBe(true);
  });

  it('renderiza arquivo de imagem do backend como imagem real', async () => {
    const loadDareProof = jest.fn().mockResolvedValue(
      makeProofResponse({
        mediaType: 'file',
        fileUrl: 'https://cdn.example.com/proof-image.jpg',
      }),
    );

    const { result } = renderHook(() =>
      useProofDetailScreen(
        {
          proofId: 'proof-image',
          source: 'backend',
        },
        { loadDareProof },
      ),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('ready');
    });

    expect(result.current.proof.mediaType).toBe('image');
    expect(result.current.proof.thumbnailUri).toBe(
      'https://cdn.example.com/proof-image.jpg',
    );
    expect(result.current.state.isImage).toBe(true);
  });

  it('mantem fallback para audio e arquivo generico', async () => {
    const audioLoad = jest.fn().mockResolvedValue(
      makeProofResponse({
        id: 'proof-audio',
        mediaType: 'audio',
        fileUrl: 'https://cdn.example.com/proof.mp3',
      }),
    );
    const fileLoad = jest.fn().mockResolvedValue(
      makeProofResponse({
        id: 'proof-file',
        mediaType: 'file',
        fileUrl: 'https://cdn.example.com/proof.pdf',
      }),
    );

    const audioHook = renderHook(() =>
      useProofDetailScreen(
        {
          proofId: 'proof-audio',
          source: 'backend',
        },
        { loadDareProof: audioLoad },
      ),
    );
    const fileHook = renderHook(() =>
      useProofDetailScreen(
        {
          proofId: 'proof-file',
          source: 'backend',
        },
        { loadDareProof: fileLoad },
      ),
    );

    await waitFor(() => {
      expect(audioHook.result.current.contentState).toBe('ready');
    });
    await waitFor(() => {
      expect(fileHook.result.current.contentState).toBe('ready');
    });

    expect(audioHook.result.current.proof.mediaType).toBe('audio');
    expect(audioHook.result.current.state.isAudio).toBe(true);
    expect(fileHook.result.current.proof.mediaType).toBe('file');
  });

  it('mapeia acesso negado para estado dedicado sem perder mensagem amigavel', async () => {
    const loadDareProof = jest
      .fn()
      .mockRejectedValue(makeApiError(403, 'Acesso negado'));

    const { result } = renderHook(() =>
      useProofDetailScreen(
        {
          proofId: 'proof-private',
          source: 'backend',
        },
        { loadDareProof },
      ),
    );

    await waitFor(() => {
      expect(result.current.contentState).toBe('access-denied');
    });

    expect(result.current.errorMessage).toBe(
      'Voce nao tem permissao para visualizar esta prova.',
    );
  });
});
