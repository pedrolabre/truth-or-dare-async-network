import { useCallback, useState } from 'react';

import {
  blockClubMember,
  reportClub,
  reportClubPrompt,
  reportClubPromptComment,
  reportClubPromptResponse,
  suspendClubMemberPosting,
} from '../services/clubsApi';
import type { ClubReportTarget } from '../types/clubs';
import type {
  ClubMemberApi,
  ClubReportApi,
  CreateClubReportPayloadApi,
  SuspendClubMemberPostingPayloadApi,
} from '../types/clubsApi';

type ReportClubAction = (
  clubId: string,
  payload: CreateClubReportPayloadApi,
) => Promise<ClubReportApi>;

type ReportClubPromptAction = (
  clubId: string,
  promptId: string,
  payload: CreateClubReportPayloadApi,
) => Promise<ClubReportApi>;

type ReportClubPromptResponseAction = (
  clubId: string,
  promptId: string,
  responseId: string,
  payload: CreateClubReportPayloadApi,
) => Promise<ClubReportApi>;

type ReportClubPromptCommentAction = (
  clubId: string,
  promptId: string,
  commentId: string,
  payload: CreateClubReportPayloadApi,
) => Promise<ClubReportApi>;

type RestrictClubMemberAction = (
  clubId: string,
  userId: string,
) => Promise<ClubMemberApi>;

type SuspendClubMemberPostingAction = (
  clubId: string,
  userId: string,
  payload: SuspendClubMemberPostingPayloadApi,
) => Promise<ClubMemberApi>;

type UseClubModerationOptions = {
  reportClubAction?: ReportClubAction;
  reportClubPromptAction?: ReportClubPromptAction;
  reportClubPromptResponseAction?: ReportClubPromptResponseAction;
  reportClubPromptCommentAction?: ReportClubPromptCommentAction;
  blockClubMemberAction?: RestrictClubMemberAction;
  suspendClubMemberPostingAction?: SuspendClubMemberPostingAction;
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message ? error.message : fallbackMessage;
}

function getDefaultSuspendedUntil() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

export function useClubModeration({
  reportClubAction = reportClub,
  reportClubPromptAction = reportClubPrompt,
  reportClubPromptResponseAction = reportClubPromptResponse,
  reportClubPromptCommentAction = reportClubPromptComment,
  blockClubMemberAction = blockClubMember,
  suspendClubMemberPostingAction = suspendClubMemberPosting,
}: UseClubModerationOptions = {}) {
  const [activeReportTarget, setActiveReportTarget] =
    useState<ClubReportTarget | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportErrorMessage, setReportErrorMessage] = useState<string | null>(
    null,
  );
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(
    null,
  );
  const [restrictingUserId, setRestrictingUserId] = useState<string | null>(null);
  const [restrictionErrorMessage, setRestrictionErrorMessage] = useState<
    string | null
  >(null);
  const [restrictionSuccessMessage, setRestrictionSuccessMessage] = useState<
    string | null
  >(null);

  const openReport = useCallback((target: ClubReportTarget) => {
    setActiveReportTarget(target);
    setReportErrorMessage(null);
    setReportSuccessMessage(null);
  }, []);

  const closeReport = useCallback(() => {
    if (isSubmittingReport) {
      return;
    }

    setActiveReportTarget(null);
    setReportErrorMessage(null);
    setReportSuccessMessage(null);
  }, [isSubmittingReport]);

  const submitReport = useCallback(
    async (payload: CreateClubReportPayloadApi) => {
      if (!activeReportTarget || isSubmittingReport) {
        return null;
      }

      setIsSubmittingReport(true);
      setReportErrorMessage(null);
      setReportSuccessMessage(null);

      try {
        let report: ClubReportApi;

        if (activeReportTarget.type === 'club') {
          report = await reportClubAction(activeReportTarget.clubId, payload);
        } else if (activeReportTarget.type === 'prompt') {
          report = await reportClubPromptAction(
            activeReportTarget.clubId,
            activeReportTarget.promptId,
            payload,
          );
        } else if (activeReportTarget.type === 'response') {
          report = await reportClubPromptResponseAction(
            activeReportTarget.clubId,
            activeReportTarget.promptId,
            activeReportTarget.responseId,
            payload,
          );
        } else {
          report = await reportClubPromptCommentAction(
            activeReportTarget.clubId,
            activeReportTarget.promptId,
            activeReportTarget.commentId,
            payload,
          );
        }

        setReportSuccessMessage('Denuncia enviada para analise.');
        return report;
      } catch (error) {
        setReportErrorMessage(
          getErrorMessage(error, 'Nao foi possivel enviar a denuncia.'),
        );
        return null;
      } finally {
        setIsSubmittingReport(false);
      }
    },
    [
      activeReportTarget,
      isSubmittingReport,
      reportClubAction,
      reportClubPromptAction,
      reportClubPromptCommentAction,
      reportClubPromptResponseAction,
    ],
  );

  const finishReport = useCallback(() => {
    setActiveReportTarget(null);
    setReportErrorMessage(null);
    setReportSuccessMessage(null);
  }, []);

  const blockMember = useCallback(
    async (clubId: string, userId: string) => {
      if (restrictingUserId) {
        return null;
      }

      setRestrictingUserId(userId);
      setRestrictionErrorMessage(null);
      setRestrictionSuccessMessage(null);

      try {
        const member = await blockClubMemberAction(clubId, userId);
        setRestrictionSuccessMessage('Membro bloqueado no clube.');
        return member;
      } catch (error) {
        setRestrictionErrorMessage(
          getErrorMessage(error, 'Nao foi possivel bloquear este membro.'),
        );
        return null;
      } finally {
        setRestrictingUserId(null);
      }
    },
    [blockClubMemberAction, restrictingUserId],
  );

  const suspendMemberPosting = useCallback(
    async (
      clubId: string,
      userId: string,
      suspendedUntil = getDefaultSuspendedUntil(),
    ) => {
      if (restrictingUserId) {
        return null;
      }

      setRestrictingUserId(userId);
      setRestrictionErrorMessage(null);
      setRestrictionSuccessMessage(null);

      try {
        const member = await suspendClubMemberPostingAction(clubId, userId, {
          suspendedUntil,
        });
        setRestrictionSuccessMessage('Postagem do membro suspensa.');
        return member;
      } catch (error) {
        setRestrictionErrorMessage(
          getErrorMessage(error, 'Nao foi possivel suspender a postagem.'),
        );
        return null;
      } finally {
        setRestrictingUserId(null);
      }
    },
    [restrictingUserId, suspendClubMemberPostingAction],
  );

  const clearRestrictionFeedback = useCallback(() => {
    setRestrictionErrorMessage(null);
    setRestrictionSuccessMessage(null);
  }, []);

  return {
    activeReportTarget,
    isSubmittingReport,
    reportErrorMessage,
    reportSuccessMessage,
    restrictingUserId,
    restrictionErrorMessage,
    restrictionSuccessMessage,
    openReport,
    closeReport,
    submitReport,
    finishReport,
    blockMember,
    suspendMemberPosting,
    clearRestrictionFeedback,
  };
}
