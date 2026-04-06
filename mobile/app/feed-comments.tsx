import React from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FeedCommentsHeader from '../components/feed-comments/FeedCommentsHeader';
import FeedCommentsContextCard from '../components/feed-comments/FeedCommentsContextCard';
import FeedCommentItem from '../components/feed-comments/FeedCommentItem';
import FeedCommentsComposer from '../components/feed-comments/FeedCommentsComposer';
import FeedCommentsLoadMore from '../components/feed-comments/FeedCommentsLoadMore';
import FeedCommentsMoreMenu from '../components/feed-comments/FeedCommentsMoreMenu';
import FeedCommentsShareModal from '../components/feed-comments/FeedCommentsShareModal';
import FeedCommentsMuteModal from '../components/feed-comments/FeedCommentsMuteModal';
import FeedCommentsReportModal from '../components/feed-comments/FeedCommentsReportModal';

import { useFeedCommentsScreen } from '../hooks/useFeedCommentsScreen';
import {
  DARK_FEED_COMMENTS_COLORS,
  LIGHT_FEED_COMMENTS_COLORS,
} from '../constants/feedCommentsTheme';
import type { FeedCommentsRouteParams } from '../types/comments';

export default function FeedCommentsScreen() {
  const params = useLocalSearchParams<FeedCommentsRouteParams>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
  } = useFeedCommentsScreen({
    params,
    colors: themeColors,
  });

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
            />
          )}
          ListHeaderComponent={
            <FeedCommentsContextCard
              context={context}
              colors={colors}
            />
          }
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
        onClose={handleCloseActiveModal}
        onSelectReason={handleSelectReportReason}
        onBack={handleBackReportStep}
        onSubmit={handleSubmitReport}
        onFinish={handleFinishReport}
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
});