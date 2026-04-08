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
import type { SearchClubItem } from '../../types/search';

type Props = {
  clubs: SearchClubItem[];
  colors: SearchThemeColors;
  onPressClub?: (club: SearchClubItem) => void;
};

export default function SearchTrendingClubs({
  clubs,
  colors,
  onPressClub,
}: Props) {
  if (clubs.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {clubs.map((club) => (
        <Pressable
          key={club.id}
          onPress={() => onPressClub?.(club)}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadow,
            },
            pressed && styles.pressed,
          ]}
        >
          <View
            style={[
              styles.cover,
              { backgroundColor: club.isTrending ? colors.green : colors.surfaceStrong },
            ]}
          >
            <View style={styles.coverOverlay} />

            <View style={styles.coverContent}>
              <Text numberOfLines={1} style={[styles.clubName, { color: colors.white }]}>
                {club.name}
              </Text>

              <Text
                numberOfLines={1}
                style={[styles.memberCount, { color: colors.white }]}
              >
                {club.memberCountLabel}
              </Text>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: club.isTrending ? colors.greenSoft : colors.redSoft,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: club.isTrending ? colors.green : colors.red },
                  ]}
                >
                  {club.badgeLabel ?? 'Clube'}
                </Text>
              </View>

              <MaterialIcons name="groups" size={16} color={colors.muted} />
            </View>

            <Text numberOfLines={2} style={[styles.description, { color: colors.subText }]}>
              {club.description}
            </Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    paddingRight: 2,
  },
  card: {
    width: 250,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cover: {
    height: 132,
    justifyContent: 'flex-end',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  coverContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  clubName: {
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  memberCount: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  body: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  badge: {
    minHeight: 26,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});