import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ClubsThemeColors } from '../../constants/clubsTheme';
import type { ClubListItem } from '../../types/clubs';

type Props = {
  club: ClubListItem;
  colors: ClubsThemeColors;
  onPress?: (club: ClubListItem) => void;
};

export default function ClubListCard({
  club,
  colors,
  onPress,
}: Props) {
  const iconName =
    (club.iconName as keyof typeof MaterialIcons.glyphMap | undefined) ?? 'groups';
  const hasUnreadActivity = club.unreadCount > 0;
  const unreadLabel = club.unreadCount > 99 ? '99+' : String(club.unreadCount);

  return (
    <Pressable
      onPress={() => onPress?.(club)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: hasUnreadActivity ? colors.greenSoft : colors.surface,
          borderColor: hasUnreadActivity ? colors.green : colors.cardBorder,
          shadowColor: '#000000',
        },
        hasUnreadActivity && styles.cardWithActivity,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: club.isActive ? colors.green : colors.surfaceStrong,
          },
        ]}
      >
        <MaterialIcons name={iconName} size={28} color={colors.white} />
      </View>

      <View style={styles.content}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
          {club.name}
        </Text>

        <Text
          numberOfLines={1}
          style={[styles.description, { color: colors.subText }]}
        >
          {club.description}
        </Text>

        <View style={styles.footerRow}>
          <View style={styles.metaRow}>
            <MaterialIcons name="groups" size={14} color={colors.muted} />
            <Text style={[styles.membersText, { color: colors.muted }]}>
              {club.membersLabel}
            </Text>
          </View>

          {club.statusLabel ? (
            <View style={styles.statusInline}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: club.isActive ? colors.green : colors.muted },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: club.isActive ? colors.green : colors.muted },
                ]}
              >
                {club.statusLabel}
              </Text>
            </View>
          ) : null}

          {hasUnreadActivity ? (
            <View
              testID="club-unread-badge"
              style={[styles.unreadBadge, { backgroundColor: colors.red }]}
            >
              <Text style={[styles.unreadBadgeText, { color: colors.white }]}>
                {unreadLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <MaterialIcons
        name={hasUnreadActivity ? 'notifications-active' : 'chevron-right'}
        size={hasUnreadActivity ? 24 : 28}
        color={hasUnreadActivity ? colors.red : colors.green}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 110,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardWithActivity: {
    shadowOpacity: 0.1,
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 7,
  },
  name: {
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  membersText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  unreadBadge: {
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
