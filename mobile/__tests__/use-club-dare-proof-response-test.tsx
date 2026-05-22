import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useClubDareProofResponse } from '../hooks/useClubDareProofResponse';
import type { ClubFeedItemApi, ClubPromptResponseApi } from '../types/clubsApi';

function makeDarePrompt(overrides: Partial<ClubFeedItemApi> = {}): ClubFeedItemApi {
  return {
    id: 'prompt-dare-1',
    clubId: 'club-1',
    authorId: 'author-1',
    authorName: 'Ana',
    type: 'dare',
    status: 'published',
    content: 'Envie uma prova criativa.',
    difficulty: 'medio',
    attachments: [],
    maxAttempts: 2,
    expiresAt: '2099-05-22T12:00:00.000Z',
    publishedAt: '2026-05-22T12:00:00.000Z',
    answersCount: 0,
    commentsCount: 0,
    likesCount: 0,
    isPinned: false,
    isMembersOnly: false,
    createdAt: '2026-05-22T12:00:00.000Z',
    updatedAt: '2026-05-22T12:00:00.000Z',
    viewerState: {
      likedByMe: false,
      answeredByMe: false,
      canAnswer: true,
    },
    recentResponses: [],
    ...overrides,
  };
}

function makeResponse(
  overrides: Partial<ClubPromptResponseApi> = {},
): ClubPromptResponseApi {
  return {
    id: 'response-1',
    clubId: 'club-1',
    promptId: 'prompt-dare-1',
    userId: 'viewer-1',
    userName: 'Viewer',
    text: 'Prova com contexto.',
    mediaUrl: 'https://cdn.example.com/proof.mp4',
    mediaType: 'video',
    dareProofId: null,
    attemptsUsed: 1,
    completedAt: '2026-05-22T13:00:00.000Z',
    likesCount: 0,
    commentsCount: 0,
    createdAt: '2026-05-22T13:00:00.000Z',
    updatedAt: '2026-05-22T13:00:00.000Z',
    ...overrides,
  };
}

describe('useClubDareProofResponse', () => {
  it('envia upload assinado antes da resposta do desafio de clube', async () => {
    const uploadFile = jest.fn().mockResolvedValue({
      bucket: 'uploads',
      path: 'comment-attachments/viewer/prompt-dare-1/proof.mp4',
      fileUrl: 'https://cdn.example.com/proof.mp4',
    });
    const submitResponse = jest.fn().mockResolvedValue(makeResponse());

    const { result } = renderHook(() =>
      useClubDareProofResponse({
        prompt: makeDarePrompt(),
        uploadFile,
        submitResponse,
      }),
    );

    act(() => {
      result.current.handleCaptureProof({
        mediaType: 'video',
        localUri: 'file:///proof.mp4',
        fileName: 'proof.mp4',
        durationSeconds: 12,
      });
      result.current.handleUpdateProofText('Prova com contexto.');
    });

    await act(async () => {
      await result.current.handleSubmitProof();
    });

    expect(uploadFile).toHaveBeenCalledWith({
      localUri: 'file:///proof.mp4',
      fileName: 'proof.mp4',
      mimeType: 'video/mp4',
      usage: 'comment-attachment',
      entityId: 'prompt-dare-1',
    });
    expect(submitResponse).toHaveBeenCalledWith({
      text: 'Prova com contexto.',
      mediaUrl: 'https://cdn.example.com/proof.mp4',
      mediaType: 'video',
      dareProofId: null,
    });
    expect(uploadFile.mock.invocationCallOrder[0]).toBeLessThan(
      submitResponse.mock.invocationCallOrder[0],
    );
  });

  it('preserva prova selecionada quando o upload falha', async () => {
    const uploadFile = jest.fn().mockRejectedValue(new Error('Upload falhou'));
    const submitResponse = jest.fn().mockResolvedValue(makeResponse());

    const { result } = renderHook(() =>
      useClubDareProofResponse({
        prompt: makeDarePrompt(),
        uploadFile,
        submitResponse,
      }),
    );

    act(() => {
      result.current.handleCaptureProof({
        mediaType: 'file',
        localUri: 'file:///proof.pdf',
        fileName: 'proof.pdf',
      });
      result.current.handleUpdateProofText('Texto preservado.');
    });

    await act(async () => {
      try {
        await result.current.handleSubmitProof();
      } catch {
        return;
      }
    });

    expect(result.current.draftProof?.localUri).toBe('file:///proof.pdf');
    expect(result.current.proofText).toBe('Texto preservado.');
    expect(result.current.errorMessage).toBe('Upload falhou');
    expect(submitResponse).not.toHaveBeenCalled();
  });

  it('preserva prova selecionada quando a resposta real falha', async () => {
    const uploadFile = jest.fn().mockResolvedValue({
      bucket: 'uploads',
      path: 'comment-attachments/viewer/prompt-dare-1/proof.mp4',
      fileUrl: 'https://cdn.example.com/proof.mp4',
    });
    const submitResponse = jest
      .fn()
      .mockRejectedValue(new Error('Resposta falhou'));

    const { result } = renderHook(() =>
      useClubDareProofResponse({
        prompt: makeDarePrompt(),
        uploadFile,
        submitResponse,
      }),
    );

    act(() => {
      result.current.handleCaptureProof({
        mediaType: 'video',
        localUri: 'file:///proof.mp4',
        fileName: 'proof.mp4',
      });
    });

    await act(async () => {
      try {
        await result.current.handleSubmitProof();
      } catch {
        return;
      }
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('Resposta falhou');
    });
    expect(result.current.draftProof?.localUri).toBe('file:///proof.mp4');
  });

  it('bloqueia prova quando prompt ja foi respondido ou expirou', async () => {
    const uploadFile = jest.fn();
    const submitResponse = jest.fn();

    const answeredHook = renderHook(() =>
      useClubDareProofResponse({
        prompt: makeDarePrompt({
          viewerState: {
            likedByMe: false,
            answeredByMe: true,
            canAnswer: true,
          },
        }),
        uploadFile,
        submitResponse,
      }),
    );

    const expiredHook = renderHook(() =>
      useClubDareProofResponse({
        prompt: makeDarePrompt({
          expiresAt: '2020-01-01T00:00:00.000Z',
        }),
        uploadFile,
        submitResponse,
      }),
    );

    expect(answeredHook.result.current.canSubmit).toBe(false);
    expect(expiredHook.result.current.canSubmit).toBe(false);
  });
});
