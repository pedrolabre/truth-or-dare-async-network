import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type ProofActionsProps = {
  likedByMe: boolean;
  likeColor: string;
  commentColor: string;
  primaryColor: string;
  primaryTextColor: string;
  borderColor: string;
  primaryActionLabel: string;
  onToggleLike: () => void;
  onComment?: () => void;
  onPrimaryAction?: () => void;
};

export default function ProofActions({
  likedByMe,
  likeColor,
  commentColor,
  primaryColor,
  primaryTextColor,
  borderColor,
  primaryActionLabel,
  onToggleLike,
  onComment,
  onPrimaryAction,
}: ProofActionsProps) {
  return (
    <View style={[styles.wrapper, { borderColor }]}>
      {/* Row principal */}
      <View style={styles.row}>
        {/* Like */}
        <Pressable
          onPress={onToggleLike}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons
            name={likedByMe ? 'favorite' : 'favorite-border'}
            size={22}
            color={likedByMe ? likeColor : likeColor}
          />
        </Pressable>

        {/* Comment */}
        <Pressable
          onPress={onComment}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons
            name="chat-bubble-outline"
            size={22}
            color={commentColor}
          />
        </Pressable>
      </View>

      {/* CTA principal */}
      <Pressable
        onPress={onPrimaryAction}
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor: primaryColor },
          pressed && styles.pressedPrimary,
        ]}
      >
        <Text style={[styles.primaryText, { color: primaryTextColor }]}>
          {primaryActionLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 12,
  },

  row: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 6,
  },

  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },

  pressedPrimary: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});