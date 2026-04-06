import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import type {
  FeedComment,
  FeedCommentsContext,
  FeedCommentsItemType,
  FeedCommentsModalType,
  FeedCommentsReportReason,
  FeedCommentsReportStep,
  FeedCommentsReplyTarget,
  UseFeedCommentsScreenInput,
} from '../types/comments';

function isSupportedItemType(value: unknown): value is FeedCommentsItemType {
  return value === 'truth' || value === 'dare' || value === 'club';
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
  const [replyTarget, setReplyTarget] = useState<FeedCommentsReplyTarget>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<FeedCommentsModalType>(null);
  const [reportStep, setReportStep] = useState<FeedCommentsReportStep>(1);
  const [selectedReportReason, setSelectedReportReason] =
    useState<FeedCommentsReportReason | null>(null);

  const itemType: FeedCommentsItemType = isSupportedItemType(params.itemType)
    ? params.itemType
    : 'truth';

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

  const canLoadMore = false;
  const canSend = message.trim().length > 0;
  const title = itemType === 'club' ? 'Respostas' : 'Comentários';

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
    setReportStep(1);
    setActiveModal('report');
  }

  function handleCloseActiveModal() {
    setActiveModal(null);
    setSelectedReportReason(null);
    setReportStep(1);
  }

  function handleSelectReportReason(reason: FeedCommentsReportReason) {
    setSelectedReportReason(reason);
    setReportStep(2);
  }

  function handleBackReportStep() {
    setReportStep(1);
  }

  function handleSubmitReport() {
    setReportStep(3);
  }

  function handleFinishReport() {
    handleCloseActiveModal();
  }

  function handleLikeComment(commentId: string) {
    setComments((current) =>
      current.map((comment) => {
        if (comment.id !== commentId) return comment;

        const likedByMe = !comment.likedByMe;

        return {
          ...comment,
          likedByMe,
          likesCount: likedByMe
            ? comment.likesCount + 1
            : comment.likesCount - 1,
        };
      }),
    );
  }

  function handleLikeReply(commentId: string, replyId: string) {
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
              likesCount: likedByMe
                ? reply.likesCount + 1
                : reply.likesCount - 1,
            };
          }),
        };
      }),
    );
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

  function handleSend() {
    if (!canSend) return;

    console.log('Enviar comentário (backend futuramente):', message);

    setMessage('');
    setReplyTarget(null);
  }

  async function handleRefresh() {
    setRefreshing(true);

    // futuro: chamar API
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
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