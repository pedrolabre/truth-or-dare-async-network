import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

import FeedCommentsHeader from '../components/feed-comments/FeedCommentsHeader';
import FeedCommentsContextCard from '../components/feed-comments/FeedCommentsContextCard';
import FeedCommentItem from '../components/feed-comments/FeedCommentItem';
import FeedCommentsComposer from '../components/feed-comments/FeedCommentsComposer';
import FeedCommentsLoadMore from '../components/feed-comments/FeedCommentsLoadMore';
import FeedCommentsMoreMenu from '../components/feed-comments/FeedCommentsMoreMenu';
import FeedCommentsShareModal from '../components/feed-comments/FeedCommentsShareModal';
import FeedCommentsMuteModal from '../components/feed-comments/FeedCommentsMuteModal';
import FeedCommentsReportModal from '../components/feed-comments/FeedCommentsReportModal';
import FeedCommentActionsMenu from '../components/feed-comments/FeedCommentActionsMenu';
import FeedCommentEditModal from '../components/feed-comments/FeedCommentEditModal';
import FeedCommentDeleteConfirmModal from '../components/feed-comments/FeedCommentDeleteConfirmModal';
import FeedCommentReportModal from '../components/feed-comments/FeedCommentReportModal';

import { useFeedCommentsScreen } from '../hooks/useFeedCommentsScreen';
import {
  DARK_FEED_COMMENTS_COLORS,
  LIGHT_FEED_COMMENTS_COLORS,
} from '../constants/feedCommentsTheme';
import type { FeedCommentsRouteParams } from '../types/comments';

export default function FeedCommentsScreen() {
  const params = useLocalSearchParams<FeedCommentsRouteParams>();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const themeColors = isDark
    ? DARK_FEED_COMMENTS_COLORS
    : LIGHT_FEED_COMMENTS_COLORS;

  const {
    title,
    colors,
    context,
    comments,
    refreshing,
    isLoadingMore,
    isInitialLoading,
    errorMessage,
    isEmpty,
    unavailableMessage,
    canLoadMore,
    message,
    canSend,
    replyTarget,
    isMenuOpen,
    shareVisible,
    muteVisible,
    reportVisible,
    reportStep,
    selectedReportReason,
    isSubmittingReport,
    reportErrorMessage,

    selectedCommentActionTarget,
    commentActionsMenuVisible,
    commentEditModalVisible,
    commentDeleteModalVisible,
    commentReportModalVisible,

    isSubmittingCommentEdit,
    commentEditErrorMessage,

    isSubmittingCommentDelete,
    commentDeleteErrorMessage,

    selectedCommentReportReason,
    isSubmittingCommentReport,
    commentReportErrorMessage,
    isCommentReportSuccess,

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

    handleOpenCommentActions,
    handleCloseCommentActionModal,
    handleOpenCommentEditModal,
    handleOpenCommentDeleteModal,
    handleOpenCommentReportModal,
    handleSubmitCommentEdit,
    handleSubmitCommentDelete,
    handleSelectCommentReportReason,
    handleSubmitCommentReport,

    handleGoBack,
  } = useFeedCommentsScreen({
    params,
    colors: themeColors,
  });

  function renderEmptyState() {
    if (isInitialLoading) {
      return (
        <View
          style={[
            styles.stateCard,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.onSurface }]}>
            Carregando comentários...
          </Text>
        </View>
      );
    }

    if (unavailableMessage) {
      return (
        <View
          style={[
            styles.stateCard,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <Text style={[styles.stateTitle, { color: colors.onSurface }]}>
            Recurso ainda não disponível
          </Text>
          <Text style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
            {unavailableMessage}
          </Text>
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View
          style={[
            styles.stateCard,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <Text style={[styles.stateTitle, { color: colors.onSurface }]}>
            Não foi possível carregar os comentários
          </Text>
          <Text style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
            {errorMessage}
          </Text>

          <Pressable
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
          >
            <Text style={[styles.retryButtonText, { color: colors.white }]}>
              Tentar novamente
            </Text>
          </Pressable>
        </View>
      );
    }

    if (isEmpty) {
      return (
        <View
          style={[
            styles.stateCard,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <Text style={[styles.stateTitle, { color: colors.onSurface }]}>
            Ainda não há comentários
          </Text>
          <Text style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
            Seja a primeira pessoa a comentar nessa truth.
          </Text>
        </View>
      );
    }

    return null;
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surfaceBright }]}
    >
      <FeedCommentsHeader
        title={title}
        colors={colors}
        topInset={insets.top}
        onPressBack={handleGoBack}
        onPressMenu={handleOpenMenu}
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FeedCommentItem
              comment={item}
              colors={colors}
              onPressLike={handleLikeComment}
              onPressReply={handleReplyComment}
              onPressLikeReply={handleLikeReply}
              onPressActions={handleOpenCommentActions}
            />
          )}
          ListHeaderComponent={
            <FeedCommentsContextCard
              context={context}
              colors={colors}
            />
          }
          ListEmptyComponent={renderEmptyState}  
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListFooterComponent={
            <FeedCommentsLoadMore
              colors={colors}
              isLoading={isLoadingMore}
              hasMore={canLoadMore}
              onPress={handleLoadMore}
            />
          }
        />

        <FeedCommentsComposer
          value={message}
          onChangeText={setMessage}
          onSend={handleSend}
          canSend={canSend}
          colors={colors}
          bottomInset={insets.bottom}
          replyTarget={replyTarget}
          onCancelReply={handleCancelReply}
        />
      </KeyboardAvoidingView>

      <FeedCommentsMoreMenu
        visible={isMenuOpen}
        colors={colors}
        onClose={handleCloseMenu}
        onPressShare={handleOpenShareModal}
        onPressMute={handleOpenMuteModal}
        onPressReport={handleOpenReportModal}
      />

      <FeedCommentsShareModal
        visible={shareVisible}
        colors={colors}
        title={title}
        text={context.text}
        meta={context.meta}
        onClose={handleCloseActiveModal}
      />

      <FeedCommentsMuteModal
        visible={muteVisible}
        colors={colors}
        onClose={handleCloseActiveModal}
      />

      <FeedCommentsReportModal
        visible={reportVisible}
        colors={colors}
        step={reportStep}
        selectedReason={selectedReportReason}
        isSubmitting={isSubmittingReport}
        errorMessage={reportErrorMessage}
        onClose={handleCloseActiveModal}
        onSelectReason={handleSelectReportReason}
        onBack={handleBackReportStep}
        onSubmit={handleSubmitReport}
        onFinish={handleFinishReport}
      />

      <FeedCommentActionsMenu
        visible={commentActionsMenuVisible}
        colors={colors}
        target={selectedCommentActionTarget}
        onClose={handleCloseCommentActionModal}
        onPressEdit={handleOpenCommentEditModal}
        onPressDelete={handleOpenCommentDeleteModal}
        onPressReport={handleOpenCommentReportModal}
      />

      <FeedCommentEditModal
        visible={commentEditModalVisible}
        colors={colors}
        target={selectedCommentActionTarget}
        isSubmitting={isSubmittingCommentEdit}
        errorMessage={commentEditErrorMessage}
        onClose={handleCloseCommentActionModal}
        onSubmit={handleSubmitCommentEdit}
      />

      <FeedCommentDeleteConfirmModal
        visible={commentDeleteModalVisible}
        colors={colors}
        target={selectedCommentActionTarget}
        isSubmitting={isSubmittingCommentDelete}
        errorMessage={commentDeleteErrorMessage}
        onClose={handleCloseCommentActionModal}
        onConfirm={handleSubmitCommentDelete}
      />

      <FeedCommentReportModal
        visible={commentReportModalVisible}
        colors={colors}
        target={selectedCommentActionTarget}
        selectedReason={selectedCommentReportReason}
        isSubmitting={isSubmittingCommentReport}
        errorMessage={commentReportErrorMessage}
        isSuccess={isCommentReportSuccess}
        onClose={handleCloseCommentActionModal}
        onSelectReason={handleSelectCommentReportReason}
        onSubmit={handleSubmitCommentReport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 18,
  },
  stateCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 10,
  },
  stateTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 6,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  retryButtonText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
  },
});