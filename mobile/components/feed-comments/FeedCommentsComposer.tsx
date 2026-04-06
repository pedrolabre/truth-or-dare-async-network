import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type {
  FeedCommentsColors,
  FeedCommentsReplyTarget,
} from '../../types/comments';

type FeedCommentsComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  canSend: boolean;
  colors: FeedCommentsColors;
  bottomInset: number;
  replyTarget?: FeedCommentsReplyTarget;
  onCancelReply?: () => void;
};

export default function FeedCommentsComposer({
  value,
  onChangeText,
  onSend,
  canSend,
  colors,
  bottomInset,
  replyTarget = null,
  onCancelReply,
}: FeedCommentsComposerProps) {
  const sendScale = React.useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    if (!canSend) {
      return;
    }

    Animated.spring(sendScale, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  }

  function handlePressOut() {
    if (!canSend) {
      return;
    }

    Animated.spring(sendScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  }

  const placeholder = replyTarget
    ? `Responder ${replyTarget.author}...`
    : 'Escreva um comentário...';

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.surfaceBright,
          borderTopColor: colors.outlineVariant,
          paddingBottom: Math.max(bottomInset, 8),
        },
      ]}
    >
      {replyTarget ? (
        <View
          style={[
            styles.replyBanner,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <View style={styles.replyTextWrap}>
            <Text style={[styles.replyLabel, { color: colors.primary }]}>
              Respondendo
            </Text>
            <Text style={[styles.replyAuthor, { color: colors.onSurface }]}>
              @{replyTarget.author}
            </Text>
          </View>

          {onCancelReply ? (
            <Pressable
              onPress={onCancelReply}
              hitSlop={8}
              style={({ pressed }) => [
                styles.replyCloseButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons name="close" size={18} color={colors.outline} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surfaceContainer,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.outline}
          multiline
          textAlignVertical="top"
          style={[styles.input, { color: colors.onSurface }]}
        />

        <Animated.View style={{ transform: [{ scale: sendScale }] }}>
          <Pressable
            onPress={onSend}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: canSend
                  ? colors.primary
                  : colors.outlineVariant,
              },
              pressed && canSend && styles.pressed,
            ]}
          >
            <MaterialIcons
              name="send"
              size={18}
              color={canSend ? colors.white : colors.outline}
            />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  replyBanner: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  replyTextWrap: {
    flex: 1,
    gap: 2,
  },
  replyLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  replyAuthor: {
    fontSize: 13,
    fontWeight: '700',
  },
  replyCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    maxHeight: 96,
    minHeight: 22,
    paddingTop: 4,
    paddingBottom: 4,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
});