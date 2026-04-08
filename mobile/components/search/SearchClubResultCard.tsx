import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { SearchThemeColors } from '../../constants/searchTheme';
import type { SearchClubItem } from '../../types/search';

type Props = {
  club: SearchClubItem;
  colors: SearchThemeColors;
  onPress?: (club: SearchClubItem) => void;
  onPressAction?: (club: SearchClubItem) => void;
};

function getClubInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function SearchClubResultCard({
  club,
  colors,
  onPress,
  onPressAction,
}: Props) {
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
      <View style={styles.left}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: club.isTrending ? colors.green : colors.surfaceStrong },
          ]}
        >
          <Text style={[styles.iconText, { color: colors.white }]}>
            {getClubInitials(club.name)}
          </Text>
        </View>

        <View style={styles.textWrap}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
              {club.name}
            </Text>

            {club.badgeLabel ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: club.isTrending
                      ? colors.greenSoft
                      : colors.redSoft,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: club.isTrending ? colors.green : colors.red,
                    },
                  ]}
                >
                  {club.badgeLabel}
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

          <View style={styles.metaRow}>
            <MaterialIcons name="groups" size={14} color={colors.muted} />
            <Text
              numberOfLines={1}
              style={[styles.memberCount, { color: colors.muted }]}
            >
              {club.memberCountLabel}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => onPressAction?.(club)}
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
    minHeight: 98,
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
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  textWrap: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  badge: {
    minHeight: 22,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  memberCount: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
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