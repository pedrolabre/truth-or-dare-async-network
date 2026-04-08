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

  return (
    <Pressable
      onPress={() => onPress?.(club)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
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
        <View style={styles.headerRow}>
          <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
            {club.name}
          </Text>

          {club.statusLabel ? (
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: club.isActive ? colors.greenSoft : colors.redSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: club.isActive ? colors.green : colors.red },
                ]}
              >
                {club.statusLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <Text
          numberOfLines={2}
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

          <Text style={[styles.actionText, { color: colors.green }]}>
            Abrir clube
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 96,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  statusBadge: {
    minHeight: 24,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  footerRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  membersText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});