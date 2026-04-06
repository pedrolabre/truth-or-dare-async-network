import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FeedComment, FeedCommentsColors } from '../../types/comments';

type FeedCommentItemProps = {
  comment: FeedComment;
  colors: FeedCommentsColors;
  onPressLike: (commentId: string) => void;
  onPressReply: (commentId: string) => void;
  onPressLikeReply?: (commentId: string, replyId: string) => void;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function FeedCommentItem({
  comment,
  colors,
  onPressLike,
  onPressReply,
  onPressLikeReply,
}: FeedCommentItemProps) {
  const likedColor = comment.likedByMe ? colors.tertiary : colors.outline;
  const hasReplies = comment.replies.length > 0;

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <Text style={[styles.avatarText, { color: colors.onSurface }]}>
            {getInitials(comment.author)}
          </Text>
        </View>

        <View style={styles.content}>
          <View
            style={[
              styles.bubble,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.bubbleHeader}>
              <Text style={[styles.author, { color: colors.onSurface }]}>
                {comment.author}
              </Text>

              <Text style={[styles.time, { color: colors.outline }]}>
                {comment.time}
              </Text>
            </View>

            <Text style={[styles.text, { color: colors.onSurfaceVariant }]}>
              {comment.content}
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => onPressLike(comment.id)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons
                name={comment.likedByMe ? 'favorite' : 'favorite-border'}
                size={16}
                color={likedColor}
              />
              <Text style={[styles.actionText, { color: likedColor }]}>
                {comment.likesCount}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onPressReply(comment.id)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.replyText, { color: colors.outline }]}>
                Responder
              </Text>
            </Pressable>
          </View>

          {hasReplies ? (
            <View style={styles.repliesSection}>
              <View
                style={[
                  styles.repliesDivider,
                  { backgroundColor: colors.outlineVariant },
                ]}
              />

              <View style={styles.repliesList}>
                {comment.replies.map((reply) => {
                  const replyLikedColor = reply.likedByMe
                    ? colors.tertiary
                    : colors.outline;

                  return (
                    <View key={reply.id} style={styles.replyRow}>
                      <View
                        style={[
                          styles.replyAvatar,
                          {
                            backgroundColor: colors.surfaceContainerLow,
                            borderColor: colors.outlineVariant,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.replyAvatarText, { color: colors.onSurface }]}
                        >
                          {getInitials(reply.author)}
                        </Text>
                      </View>

                      <View style={styles.replyContent}>
                        <View
                          style={[
                            styles.replyBubble,
                            {
                              backgroundColor: colors.surfaceContainerLow,
                              borderColor: colors.outlineVariant,
                            },
                          ]}
                        >
                          <View style={styles.replyHeader}>
                            <Text
                              style={[styles.replyAuthor, { color: colors.onSurface }]}
                            >
                              {reply.author}
                            </Text>

                            <Text
                              style={[styles.replyTime, { color: colors.outline }]}
                            >
                              {reply.time}
                            </Text>
                          </View>

                          <Text
                            style={[
                              styles.replyBody,
                              { color: colors.onSurfaceVariant },
                            ]}
                          >
                            {reply.content}
                          </Text>
                        </View>

                        <View style={styles.replyActions}>
                          <Pressable
                            disabled={!onPressLikeReply}
                            onPress={() => onPressLikeReply?.(comment.id, reply.id)}
                            hitSlop={8}
                            style={({ pressed }) => [
                              styles.actionButton,
                              pressed && styles.pressed,
                              !onPressLikeReply && styles.disabledAction,
                            ]}
                          >
                            <MaterialIcons
                              name={reply.likedByMe ? 'favorite' : 'favorite-border'}
                              size={14}
                              color={replyLikedColor}
                            />
                            <Text
                              style={[
                                styles.replyActionText,
                                { color: replyLikedColor },
                              ]}
                            >
                              {reply.likesCount}
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={() => onPressReply(comment.id)}
                            hitSlop={8}
                            style={({ pressed }) => [
                              styles.actionButton,
                              pressed && styles.pressed,
                            ]}
                          >
                            <Text
                              style={[
                                styles.replyActionText,
                                { color: colors.outline },
                              ]}
                            >
                              Responder
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '900',
  },
  content: {
    flex: 1,
  },
  bubble: {
    borderRadius: 18,
    borderTopLeftRadius: 6,
    borderWidth: 1,
    padding: 14,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  author: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  time: {
    fontSize: 10,
    fontWeight: '600',
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 8,
    marginLeft: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '800',
  },
  replyText: {
    fontSize: 11,
    fontWeight: '800',
  },
  repliesSection: {
    marginTop: 14,
    paddingLeft: 8,
  },
  repliesDivider: {
    width: 28,
    height: 1,
    marginBottom: 12,
    opacity: 0.6,
  },
  repliesList: {
    gap: 12,
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  replyAvatar: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  replyAvatarText: {
    fontSize: 9,
    fontWeight: '900',
  },
  replyContent: {
    flex: 1,
  },
  replyBubble: {
    borderRadius: 16,
    borderTopLeftRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  replyAuthor: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  replyTime: {
    fontSize: 10,
    fontWeight: '600',
  },
  replyBody: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 7,
    marginLeft: 4,
  },
  replyActionText: {
    fontSize: 10,
    fontWeight: '800',
  },
  disabledAction: {
    opacity: 0.75,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
});