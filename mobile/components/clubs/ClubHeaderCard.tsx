import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ClubsThemeColors } from '../../constants/clubsTheme';
import type { ClubDetail } from '../../types/clubs';

type Props = {
  club: ClubDetail;
  colors: ClubsThemeColors;
  onInvite?: () => void;
};

function getClubIconName(club: ClubDetail) {
  return (
    (club.iconName as keyof typeof MaterialIcons.glyphMap | undefined) ??
    'groups'
  );
}

export default function ClubHeaderCard({ club, colors, onInvite }: Props) {
  const iconName = getClubIconName(club);

  return (
    <View
      testID="club-header-card"
      style={styles.card}
    >
      <View style={[styles.cover, { backgroundColor: colors.green }]}>
        {club.coverUrl ? (
          <Image
            source={{ uri: club.coverUrl }}
            resizeMode="cover"
            style={styles.coverImage}
          />
        ) : (
          <View
            style={[
              styles.coverFallback,
              { backgroundColor: colors.green },
            ]}
          />
        )}
      </View>

      <View style={styles.identitySection}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: club.status === 'active'
                ? colors.green
                : colors.surfaceStrong,
              borderColor: colors.background,
              shadowColor: '#000000',
            },
          ]}
        >
          {club.avatarUrl ? (
            <Image
              source={{ uri: club.avatarUrl }}
              resizeMode="cover"
              style={styles.avatarImage}
            />
          ) : (
            <MaterialIcons name={iconName} size={34} color={colors.white} />
          )}
        </View>

        <View style={styles.titleRow}>
          <Text
            numberOfLines={2}
            testID="club-header-name"
            style={[styles.name, { color: colors.text }]}
          >
            {club.name}
          </Text>

          {club.permissions.canInviteMembers && onInvite ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Convidar amigos"
              testID="club-header-invite"
              onPress={onInvite}
              style={({ pressed }) => [
                styles.invitePill,
                { backgroundColor: colors.greenSoft },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.inviteText, { color: colors.green }]}>
                Convidar
              </Text>
            </Pressable>
          ) : null}
        </View>

        {club.tags.length > 0 ? (
          <View testID="club-header-tags" style={styles.locationRow}>
            <MaterialIcons name="place" size={18} color={colors.muted} />
            <Text
              numberOfLines={1}
              style={[styles.locationText, { color: colors.muted }]}
            >
              {club.tags.slice(0, 2).join(', ')}
            </Text>
            {club.tags.map((tag) => (
              <Text key={tag} style={styles.hiddenText}>
                #{tag}
              </Text>
            ))}
          </View>
        ) : null}

        <Text
          numberOfLines={4}
          style={[styles.description, { color: colors.text }]}
        >
          {club.description}
        </Text>

        <View style={[styles.statsGrid, { borderColor: colors.cardBorder }]}>
          <StatTile
            colors={colors}
            label="Membros"
            value={String(club.memberCount)}
          />
          <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
          <StatTile
            colors={colors}
            label="Prompts"
            value={String(club.promptCount)}
          />
          <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
          <StatTile
            colors={colors}
            label="Status"
            value={club.statusLabel}
          />
        </View>

        <View style={styles.metaPills}>
          <MetaPill colors={colors} label={club.membersLabel} />
          <MetaPill colors={colors} label={club.promptsLabel} />
          <MetaPill colors={colors} label={club.membershipLabel} />
          <Text style={styles.hiddenText}>{club.membershipLabel}</Text>
          <MetaPill colors={colors} label={club.visibilityLabel} />
        </View>
      </View>
    </View>
  );
}

type StatTileProps = {
  colors: ClubsThemeColors;
  label: string;
  value: string;
};

function StatTile({ colors, label, value }: StatTileProps) {
  return (
    <View style={styles.statTile}>
      <Text numberOfLines={1} style={[styles.statValue, { color: colors.text }]}>
        {value}
      </Text>
      <Text numberOfLines={1} style={[styles.statLabel, { color: colors.muted }]}>
        {label}
      </Text>
    </View>
  );
}

type MetaPillProps = {
  colors: ClubsThemeColors;
  label: string;
};

function MetaPill({ colors, label }: MetaPillProps) {
  return (
    <View style={[styles.metaPill, { backgroundColor: colors.greenSoft }]}>
      <Text numberOfLines={1} style={[styles.metaPillText, { color: colors.green }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  cover: {
    height: 150,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    flex: 1,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  identitySection: {
    marginTop: -48,
    paddingHorizontal: 22,
    paddingBottom: 4,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 14,
  },
  name: {
    flex: 1,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  invitePill: {
    minHeight: 42,
    borderRadius: 999,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  locationRow: {
    marginTop: -8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  description: {
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '500',
  },
  statsGrid: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  statDivider: {
    width: 1,
    height: 38,
  },
  statValue: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  metaPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaPillText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  hiddenText: {
    position: 'absolute',
    opacity: 0,
  },
  pressed: {
    opacity: 0.82,
  },
});
