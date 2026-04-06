import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FeedCommentsColors } from '../../types/comments';

type FeedCommentsHeaderProps = {
  title: string;
  colors: FeedCommentsColors;
  topInset: number;
  onPressBack: () => void;
  onPressMenu: () => void;
};

export default function FeedCommentsHeader({
  title,
  colors,
  topInset,
  onPressBack,
  onPressMenu,
}: FeedCommentsHeaderProps) {
  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.headerGreen,
          paddingTop: topInset,
          borderBottomColor: 'rgba(207,247,238,0.20)',
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.left}>
          <Pressable
            hitSlop={10}
            onPress={onPressBack}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: 'rgba(255,255,255,0.08)' },
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name="arrow-back" size={21} color={colors.white} />
          </Pressable>

          <Text numberOfLines={1} style={[styles.title, { color: colors.white }]}>
            {title}
          </Text>
        </View>

        <Pressable
          hitSlop={10}
          onPress={onPressMenu}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: 'rgba(255,255,255,0.08)' },
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name="more-vert" size={19} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
  },
  header: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 19,
    lineHeight: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
});