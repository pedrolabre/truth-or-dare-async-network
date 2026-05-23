import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useClubModeration } from '../hooks/useClubModeration';
import type { ClubMemberApi, ClubReportApi } from '../types/clubsApi';

function makeReport(overrides: Partial<ClubReportApi> = {}): ClubReportApi {
  return {
    id: 'report-1',
    clubId: 'club-1',
    targetType: 'club',
    targetId: 'club-1',
    reason: 'spam',
    details: null,
    createdAt: '2026-05-23T12:00:00.000Z',
    ...overrides,
  };
}

function makeMember(overrides: Partial<ClubMemberApi> = {}): ClubMemberApi {
  return {
    id: 'membership-1',
    clubId: 'club-1',
    userId: 'user-2',
    name: 'Bia Membro',
    username: 'bia',
    role: 'member',
    status: 'active',
    joinedAt: '2026-05-20T12:00:00.000Z',
    lastSeenAt: null,
    mutedUntil: null,
    postingSuspendedUntil: null,
    createdAt: '2026-05-20T12:00:00.000Z',
    updatedAt: '2026-05-20T12:00:00.000Z',
    ...overrides,
  };
}

describe('useClubModeration', () => {
  it('envia denuncia de clube com payload real', async () => {
    const reportClubAction = jest.fn().mockResolvedValue(makeReport());
    const { result } = renderHook(() =>
      useClubModeration({ reportClubAction }),
    );

    act(() => {
      result.current.openReport({
        type: 'club',
        clubId: 'club-1',
        title: 'Bons Desafios',
      });
    });

    await act(async () => {
      await result.current.submitReport({
        reason: 'spam',
        details: 'Convites repetidos.',
      });
    });

    expect(reportClubAction).toHaveBeenCalledWith('club-1', {
      reason: 'spam',
      details: 'Convites repetidos.',
    });
    expect(result.current.reportSuccessMessage).toBe(
      'Denuncia enviada para analise.',
    );
  });

  it('envia denuncia de prompt resposta e comentario pelos endpoints corretos', async () => {
    const reportClubPromptAction = jest
      .fn()
      .mockResolvedValue(makeReport({ targetType: 'club_prompt' }));
    const reportClubPromptResponseAction = jest
      .fn()
      .mockResolvedValue(makeReport({ targetType: 'club_prompt_response' }));
    const reportClubPromptCommentAction = jest
      .fn()
      .mockResolvedValue(makeReport({ targetType: 'club_prompt_comment' }));
    const { result } = renderHook(() =>
      useClubModeration({
        reportClubPromptAction,
        reportClubPromptResponseAction,
        reportClubPromptCommentAction,
      }),
    );

    act(() => {
      result.current.openReport({
        type: 'prompt',
        clubId: 'club-1',
        promptId: 'prompt-1',
        title: 'Prompt ruim',
      });
    });
    await act(async () => {
      await result.current.submitReport({ reason: 'hate', details: null });
    });

    act(() => {
      result.current.openReport({
        type: 'response',
        clubId: 'club-1',
        promptId: 'prompt-1',
        responseId: 'response-1',
        title: 'Resposta ruim',
      });
    });
    await act(async () => {
      await result.current.submitReport({ reason: 'harassment', details: null });
    });

    act(() => {
      result.current.openReport({
        type: 'comment',
        clubId: 'club-1',
        promptId: 'prompt-1',
        commentId: 'comment-1',
        title: 'Comentario ruim',
      });
    });
    await act(async () => {
      await result.current.submitReport({ reason: 'other', details: null });
    });

    expect(reportClubPromptAction).toHaveBeenCalledWith('club-1', 'prompt-1', {
      reason: 'hate',
      details: null,
    });
    expect(reportClubPromptResponseAction).toHaveBeenCalledWith(
      'club-1',
      'prompt-1',
      'response-1',
      { reason: 'harassment', details: null },
    );
    expect(reportClubPromptCommentAction).toHaveBeenCalledWith(
      'club-1',
      'prompt-1',
      'comment-1',
      { reason: 'other', details: null },
    );
  });

  it('preserva erro de denuncia sem fechar o modal', async () => {
    const reportClubAction = jest
      .fn()
      .mockRejectedValue(new Error('Denuncia duplicada'));
    const { result } = renderHook(() =>
      useClubModeration({ reportClubAction }),
    );

    act(() => {
      result.current.openReport({
        type: 'club',
        clubId: 'club-1',
        title: 'Bons Desafios',
      });
    });

    await act(async () => {
      await result.current.submitReport({ reason: 'spam', details: null });
    });

    expect(result.current.activeReportTarget?.type).toBe('club');
    expect(result.current.reportErrorMessage).toBe('Denuncia duplicada');
  });

  it('bloqueia membro e suspende postagem chamando endpoints reais injetados', async () => {
    const blockClubMemberAction = jest
      .fn()
      .mockResolvedValue(makeMember({ status: 'blocked' }));
    const suspendClubMemberPostingAction = jest.fn().mockResolvedValue(
      makeMember({
        postingSuspendedUntil: '2026-05-24T12:00:00.000Z',
      }),
    );
    const { result } = renderHook(() =>
      useClubModeration({
        blockClubMemberAction,
        suspendClubMemberPostingAction,
      }),
    );

    await act(async () => {
      await result.current.blockMember('club-1', 'user-2');
      await result.current.suspendMemberPosting(
        'club-1',
        'user-2',
        '2026-05-24T12:00:00.000Z',
      );
    });

    await waitFor(() => {
      expect(blockClubMemberAction).toHaveBeenCalledWith('club-1', 'user-2');
    });
    expect(suspendClubMemberPostingAction).toHaveBeenCalledWith(
      'club-1',
      'user-2',
      { suspendedUntil: '2026-05-24T12:00:00.000Z' },
    );
    expect(result.current.restrictionSuccessMessage).toBe(
      'Postagem do membro suspensa.',
    );
  });
});
