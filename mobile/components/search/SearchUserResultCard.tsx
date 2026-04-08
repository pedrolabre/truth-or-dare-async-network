import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { SearchThemeColors } from '../../constants/searchTheme';
import type { SearchUserItem } from '../../types/search';

type Props = {
  user: SearchUserItem;
  colors: SearchThemeColors;
  onPress?: (user: SearchUserItem) => void;
  onPressAction?: (user: SearchUserItem) => void;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function SearchUserResultCard({
  user,
  colors,
  onPress,
  onPressAction,
}: Props) {
  return (
    <Pressable
      onPress={() => onPress?.(user)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.left}>
        <View style={styles.avatarWrap}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.avatarFallbackBg },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: colors.avatarFallbackText },
              ]}
            >
              {getInitials(user.name)}
            </Text>
          </View>

          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: user.isOnline ? colors.online : colors.outline,
                borderColor: colors.surface,
              },
            ]}
          />
        </View>

        <View style={styles.textWrap}>
          <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
            {user.name}
          </Text>

          <Text numberOfLines={1} style={[styles.username, { color: colors.subText }]}>
            @{user.username.replace(/^@/, '')}
          </Text>

          <View style={styles.metaRow}>
            <Text numberOfLines={1} style={[styles.level, { color: colors.muted }]}>
              {user.levelLabel}
            </Text>

            {typeof user.mutualCount === 'number' ? (
              <View style={styles.mutualWrap}>
                <MaterialIcons name="people-outline" size={14} color={colors.muted} />
                <Text style={[styles.mutualText, { color: colors.muted }]}>
                  {user.mutualCount} em comum
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => onPressAction?.(user)}
        style={({ pressed }) => [
          styles.actionButton,
          { backgroundColor: colors.surfaceSoft },
          pressed && styles.actionPressed,
        ]}
      >
        <MaterialIcons name="chevron-right" size={20} color={colors.subText} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 84,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  statusDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 13,
    height: 13,
    borderRadius: 999,
    borderWidth: 2,
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
  },
  username: {
    fontSize: 13,
    fontWeight: '600',
  },
  metaRow: {
    marginTop: 2,
    gap: 4,
  },
  level: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  mutualWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mutualText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  actionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});