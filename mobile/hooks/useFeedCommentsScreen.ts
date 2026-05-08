import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  createTruthComment,
  getTruthComments,
  reportTruth,
  toggleTruthCommentLike,
} from '../services/api';
import type {
  FeedComment,
  FeedCommentReply,
  FeedCommentsContext,
  FeedCommentsItemType,
  FeedCommentsModalType,
  FeedCommentsReportReason,
  FeedCommentsReportStep,
  FeedCommentsReplyTarget,
  TruthCommentApiItem,
  TruthCommentApiReply,
  TruthReportReason,
  UseFeedCommentsScreenInput,
} from '../types/comments';

function isSupportedItemType(value: unknown): value is FeedCommentsItemType {
  return value === 'truth' || value === 'dare' || value === 'club';
}

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function mapReportReasonToApiReason(
  reason: FeedCommentsReportReason,
): TruthReportReason {
  if (reason === 'Spam ou fraude') {
    return 'spam';
  }

  if (reason === 'Discurso de ódio ou ofensa') {
    return 'hate';
  }

  if (reason === 'Conteúdo sexual ou nudez') {
    return 'sexual';
  }

  if (reason === 'Assédio ou bullying') {
    return 'harassment';
  }

  return 'other';
}

function formatCommentTime(value: string) {
  const createdAt = new Date(value);

  if (Number.isNaN(createdAt.getTime())) {
    return 'Agora';
  }

  const diffMs = Date.now() - createdAt.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'Agora';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} h`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays} d`;
  }

  return createdAt.toLocaleDateString('pt-BR');
}

function mapApiReplyToFeedReply(reply: TruthCommentApiReply): FeedCommentReply {
  return {
    id: reply.id,
    author: reply.author.name,
    time: formatCommentTime(reply.createdAt),
    content: reply.text,
    likesCount: reply.likesCount,
    likedByMe: reply.likedByMe,
  };
}

function mapApiCommentToFeedComment(comment: TruthCommentApiItem): FeedComment {
  return {
    id: comment.id,
    author: comment.author.name,
    time: formatCommentTime(comment.createdAt),
    content: comment.text,
    likesCount: comment.likesCount,
    likedByMe: comment.likedByMe,
    replies: comment.replies.map(mapApiReplyToFeedReply),
  };
}

export function useFeedCommentsScreen({
  params,
  colors,
}: UseFeedCommentsScreenInput) {
  const router = useRouter();

  const [comments, setComments] = useState<FeedComment[]>([]);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<FeedCommentsReplyTarget>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<FeedCommentsModalType>(null);
  const [reportStep, setReportStep] = useState<FeedCommentsReportStep>(1);
  const [selectedReportReason, setSelectedReportReason] =
    useState<FeedCommentsReportReason | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportErrorMessage, setReportErrorMessage] = useState<string | null>(
    null,
  );

  const itemType: FeedCommentsItemType = isSupportedItemType(params.itemType)
    ? params.itemType
    : 'truth';

  const itemId = normalizeParam(params.itemId);
  const isTruthCommentsAvailable = itemType === 'truth' && Boolean(itemId);

  const context: FeedCommentsContext = useMemo(() => {
    if (itemType === 'club') {
      return {
        eyebrow: params.clubName?.trim() || 'Clube',
        badge: params.badge?.trim() || 'Verdade',
        text:
          params.quote?.trim() ||
          'Publicação do clube pronta para receber respostas.',
        meta: params.commentsCount?.trim()
          ? `${params.commentsCount} respostas`
          : 'Área de respostas do clube',
        likesCountLabel: params.likesCount?.trim() || '0',
        accentColor: colors.greenText,
        accentSoft: colors.greenBgSoft,
        icon: 'groups',
      };
    }

    if (itemType === 'dare') {
      return {
        eyebrow: 'Desafio',
        badge: params.status?.trim() || 'Desafio',
        text:
          params.title?.trim() ||
          'Desafio selecionado no feed para visualizar comentários.',
        meta: params.commentsCount?.trim()
          ? `${params.commentsCount} comentários`
          : 'Discussão do desafio',
        likesCountLabel: params.likesCount?.trim() || '0',
        accentColor: colors.tertiary,
        accentSoft: colors.redBgSoft,
        icon: 'bolt',
      };
    }

    return {
      eyebrow: 'Verdade',
      badge: 'Verdade',
      text:
        params.title?.trim() ||
        'Publicação de verdade selecionada para comentários.',
      meta: params.commentsCount?.trim()
        ? `${params.commentsCount} comentários`
        : 'Discussão da verdade',
      likesCountLabel: params.likesCount?.trim() || '0',
      accentColor: colors.greenText,
      accentSoft: colors.greenBgSoft,
      icon: 'forum',
    };
  }, [
    itemType,
    params.badge,
    params.clubName,
    params.commentsCount,
    params.likesCount,
    params.quote,
    params.status,
    params.title,
    colors.greenBgSoft,
    colors.greenText,
    colors.redBgSoft,
    colors.tertiary,
  ]);

  const loadComments = useCallback(
    async ({
      showInitialLoading = false,
    }: { showInitialLoading?: boolean } = {}) => {
      if (!isTruthCommentsAvailable) {
        setComments([]);
        setErrorMessage(
          itemType === 'truth'
            ? 'Não foi possível identificar a truth selecionada.'
            : 'Comentários reais ainda não estão disponíveis para este tipo de publicação.',
        );
        return;
      }

      try {
        if (showInitialLoading) {
          setIsInitialLoading(true);
        }

        setErrorMessage(null);

        const response = await getTruthComments(itemId);
        setComments(response.map(mapApiCommentToFeedComment));
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os comentários.';

        setErrorMessage(message);
      } finally {
        if (showInitialLoading) {
          setIsInitialLoading(false);
        }
      }
    },
    [isTruthCommentsAvailable, itemId, itemType],
  );

  useEffect(() => {
    loadComments({ showInitialLoading: true });
  }, [loadComments]);

  const canLoadMore = false;
  const canSend =
    isTruthCommentsAvailable && !isSending && message.trim().length > 0;
  const title = itemType === 'club' ? 'Respostas' : 'Comentários';
  const isEmpty = !isInitialLoading && !errorMessage && comments.length === 0;
  const unavailableMessage =
    itemType === 'truth'
      ? null
      : 'Comentários reais ainda não estão disponíveis para este tipo de publicação.';

  const shareVisible = activeModal === 'share';
  const muteVisible = activeModal === 'mute';
  const reportVisible = activeModal === 'report';

  function handleGoBack() {
    router.back();
  }

  function handleOpenMenu() {
    setIsMenuOpen(true);
  }

  function handleCloseMenu() {
    setIsMenuOpen(false);
  }

  function handleOpenShareModal() {
    setIsMenuOpen(false);
    setActiveModal('share');
  }

  function handleOpenMuteModal() {
    setIsMenuOpen(false);
    setActiveModal('mute');
  }

  function handleOpenReportModal() {
    setIsMenuOpen(false);
    setSelectedReportReason(null);
    setReportErrorMessage(null);
    setReportStep(1);
    setActiveModal('report');
  }

  function handleCloseActiveModal() {
    if (isSubmittingReport) return;

    setActiveModal(null);
    setSelectedReportReason(null);
    setReportErrorMessage(null);
    setReportStep(1);
  }

  function handleSelectReportReason(reason: FeedCommentsReportReason) {
    setSelectedReportReason(reason);
    setReportErrorMessage(null);
    setReportStep(2);
  }

  function handleBackReportStep() {
    if (isSubmittingReport) return;

    setReportErrorMessage(null);
    setReportStep(1);
  }

  async function handleSubmitReport() {
    if (!isTruthCommentsAvailable || !selectedReportReason) {
      return;
    }

    try {
      setIsSubmittingReport(true);
      setReportErrorMessage(null);

      await reportTruth(itemId, {
        reason: mapReportReasonToApiReason(selectedReportReason),
      });

      setReportStep(3);
    } catch (error) {
      setReportErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar a denúncia.',
      );
    } finally {
      setIsSubmittingReport(false);
    }
  }

  function handleFinishReport() {
    handleCloseActiveModal();
  }

    async function handleLikeComment(commentId: string) {
    if (!isTruthCommentsAvailable) return;

    const previousComments = comments;

    setComments((current) =>
      current.map((comment) => {
        if (comment.id !== commentId) return comment;

        const likedByMe = !comment.likedByMe;

        return {
          ...comment,
          likedByMe,
          likesCount: Math.max(
            0,
            likedByMe ? comment.likesCount + 1 : comment.likesCount - 1,
          ),
        };
      }),
    );

    try {
      const result = await toggleTruthCommentLike(commentId);

      setComments((current) =>
        current.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                likedByMe: result.liked,
                likesCount: result.likesCount,
              }
            : comment,
        ),
      );
    } catch (error) {
      setComments(previousComments);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a curtida.',
      );
    }
  }

    async function handleLikeReply(commentId: string, replyId: string) {
    if (!isTruthCommentsAvailable) return;

    const previousComments = comments;

    setComments((current) =>
      current.map((comment) => {
        if (comment.id !== commentId) return comment;

        return {
          ...comment,
          replies: comment.replies.map((reply) => {
            if (reply.id !== replyId) return reply;

            const likedByMe = !reply.likedByMe;

            return {
              ...reply,
              likedByMe,
              likesCount: Math.max(
                0,
                likedByMe ? reply.likesCount + 1 : reply.likesCount - 1,
              ),
            };
          }),
        };
      }),
    );

    try {
      const result = await toggleTruthCommentLike(replyId);

      setComments((current) =>
        current.map((comment) => {
          if (comment.id !== commentId) return comment;

          return {
            ...comment,
            replies: comment.replies.map((reply) =>
              reply.id === replyId
                ? {
                    ...reply,
                    likedByMe: result.liked,
                    likesCount: result.likesCount,
                  }
                : reply,
            ),
          };
        }),
      );
    } catch (error) {
      setComments(previousComments);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a curtida.',
      );
    }
  }

  function handleReplyComment(commentId: string) {
    const target = comments.find((comment) => comment.id === commentId);
    if (!target) return;

    setReplyTarget({
      commentId: target.id,
      author: target.author,
    });
  }

  function handleCancelReply() {
    setReplyTarget(null);
  }

    async function handleSend() {
    if (!canSend) return;

    const normalizedMessage = message.trim();
    const parentId = replyTarget?.commentId;

    try {
      setIsSending(true);
      setErrorMessage(null);

      const createdComment = await createTruthComment(itemId, {
        text: normalizedMessage,
        parentId,
      });

      const mappedComment = mapApiCommentToFeedComment(createdComment);

      if (parentId) {
        const createdReply: FeedCommentReply = {
          id: mappedComment.id,
          author: mappedComment.author,
          time: mappedComment.time,
          content: mappedComment.content,
          likesCount: mappedComment.likesCount,
          likedByMe: mappedComment.likedByMe,
        };

        setComments((current) =>
          current.map((comment) =>
            comment.id === parentId
              ? {
                  ...comment,
                  replies: [...comment.replies, createdReply],
                }
              : comment,
          ),
        );
      } else {
        setComments((current) => [...current, mappedComment]);
      }

      setMessage('');
      setReplyTarget(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar o comentário.',
      );
    } finally {
      setIsSending(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await loadComments();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLoadMore() {
    // futuro: paginação real
  }

  return {
    title,
    colors,
    context,

    comments,
    refreshing,
    isLoadingMore,
    isInitialLoading,
    isSending,
    errorMessage,
    isEmpty,
    unavailableMessage,
    canLoadMore,

    message,
    canSend,
    replyTarget,

    isMenuOpen,
    activeModal,
    shareVisible,
    muteVisible,
    reportVisible,

    reportStep,
    selectedReportReason,
    isSubmittingReport,
    reportErrorMessage,

    setMessage,

    handleSend,
    handleRefresh,
    handleLoadMore,

    handleLikeComment,
    handleLikeReply,
    handleReplyComment,
    handleCancelReply,

    handleOpenMenu,
    handleCloseMenu,

    handleOpenShareModal,
    handleOpenMuteModal,
    handleOpenReportModal,
    handleCloseActiveModal,

    handleSelectReportReason,
    handleBackReportStep,
    handleSubmitReport,
    handleFinishReport,
    handleGoBack,
  };
}