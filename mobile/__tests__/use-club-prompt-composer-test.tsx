import { act, renderHook } from '@testing-library/react-native';

import { useClubPromptComposer } from '../hooks/useClubPromptComposer';
import type { ClubPromptApi } from '../types/clubsApi';

function makePrompt(overrides: Partial<ClubPromptApi> = {}): ClubPromptApi {
  return {
    id: 'prompt-1',
    clubId: 'club-1',
    authorId: 'user-1',
    authorName: 'Pedro',
    type: 'truth',
    status: 'published',
    content: 'Qual foi a melhor parte da semana?',
    difficulty: null,
    attachments: [],
    maxAttempts: null,
    expiresAt: null,
    publishedAt: '2026-05-21T12:00:00.000Z',
    answersCount: 0,
    commentsCount: 0,
    likesCount: 0,
    isPinned: false,
    isMembersOnly: true,
    createdAt: '2026-05-21T12:00:00.000Z',
    updatedAt: '2026-05-21T12:00:00.000Z',
    ...overrides,
  };
}

describe('useClubPromptComposer', () => {
  it('monta payload e publica prompt quando permissao permite', async () => {
    const submitPrompt = jest.fn().mockResolvedValue(makePrompt());
    const { result } = renderHook(() =>
      useClubPromptComposer({
        canPostPrompt: true,
        submitPrompt,
      }),
    );

    act(() => {
      result.current.setType('dare');
      result.current.setContent('Dance por 10 segundos');
      result.current.setDifficulty('leve');
      result.current.setMaxAttemptsText('3');
    });

    expect(result.current.canSubmit).toBe(true);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(submitPrompt).toHaveBeenCalledWith({
      type: 'dare',
      content: 'Dance por 10 segundos',
      difficulty: 'leve',
      maxAttempts: 3,
      expiresAt: null,
      isMembersOnly: true,
    });
    expect(result.current.content).toBe('');
  });

  it('bloqueia envio sem permissao ou com tentativas invalidas', async () => {
    const submitPrompt = jest.fn().mockResolvedValue(makePrompt());
    const { result, rerender } = renderHook(
      ({ canPostPrompt }: { canPostPrompt: boolean }) =>
        useClubPromptComposer({
          canPostPrompt,
          submitPrompt,
        }),
      {
        initialProps: {
          canPostPrompt: false,
        },
      },
    );

    act(() => {
      result.current.setContent('Prompt valido');
    });

    expect(result.current.canSubmit).toBe(false);

    rerender({
      canPostPrompt: true,
    });

    act(() => {
      result.current.setType('dare');
      result.current.setMaxAttemptsText('99');
    });

    expect(result.current.maxAttemptsError).toBe('Use um numero entre 1 e 50.');
    expect(result.current.canSubmit).toBe(false);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(submitPrompt).not.toHaveBeenCalled();
  });
});
