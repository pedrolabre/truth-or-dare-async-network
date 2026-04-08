import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { SearchThemeColors } from '../../constants/searchTheme';
import type { SearchUserItem } from '../../types/search';

type Props = {
  users: SearchUserItem[];
  colors: SearchThemeColors;
  onPressUser?: (user: SearchUserItem) => void;
  onPressPrimaryAction?: (user: SearchUserItem) => void;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function SearchRecommendedUsers({
  users,
  colors,
  onPressUser,
  onPressPrimaryAction,
}: Props) {
  if (users.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {users.map((user, index) => {
        const isPrimaryAction = index === 0;

        return (
          <Pressable
            key={user.id}
            onPress={() => onPressUser?.(user)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: colors.greenSoft,
                borderColor: colors.cardBorder,
              },
              pressed && styles.pressed,
            ]}
          >
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
                    borderColor: colors.background,
                  },
                ]}
              />
            </View>

            <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
              {user.name}
            </Text>

            <Text
              numberOfLines={1}
              style={[styles.level, { color: colors.muted }]}
            >
              {user.levelLabel}
            </Text>

            <Pressable
              onPress={() => onPressPrimaryAction?.(user)}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: isPrimaryAction ? colors.red : colors.surfaceStrong,
                },
                pressed && styles.actionPressed,
              ]}
            >
              {isPrimaryAction ? (
                <>
                  <MaterialIcons name="bolt" size={16} color={colors.white} />
                  <Text style={[styles.actionText, { color: colors.white }]}>
                    Desafiar
                  </Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="person-outline" size={16} color={colors.text} />
                  <Text style={[styles.actionText, { color: colors.text }]}>
                    Ver perfil
                  </Text>
                </>
              )}
            </Pressable>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingRight: 2,
  },
  card: {
    width: 170,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 2,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  statusDot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  level: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    minHeight: 30,
  },
  actionButton: {
    marginTop: 4,
    minHeight: 38,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  actionPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
});