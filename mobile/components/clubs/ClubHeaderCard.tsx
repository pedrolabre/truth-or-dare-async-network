import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { ClubsThemeColors } from '../../constants/clubsTheme';
import type { ClubDetail } from '../../types/clubs';

type Props = {
  club: ClubDetail;
  colors: ClubsThemeColors;
};

type BadgeTone = 'green' | 'red' | 'neutral';

function getClubIconName(club: ClubDetail) {
  return (
    (club.iconName as keyof typeof MaterialIcons.glyphMap | undefined) ??
    'groups'
  );
}

function getStatusTone(club: ClubDetail): BadgeTone {
  if (club.status === 'active') {
    return 'green';
  }

  if (club.status === 'archived' || club.status === 'suspended') {
    return 'red';
  }

  return 'neutral';
}

function getBadgeColors(colors: ClubsThemeColors, tone: BadgeTone) {
  if (tone === 'green') {
    return {
      backgroundColor: colors.greenSoft,
      color: colors.green,
    };
  }

  if (tone === 'red') {
    return {
      backgroundColor: colors.redSoft,
      color: colors.red,
    };
  }

  return {
    backgroundColor: colors.surfaceStrong,
    color: colors.muted,
  };
}

function getJoinPolicyLabel(club: ClubDetail) {
  if (club.joinPolicy === 'open') {
    return 'Entrada aberta';
  }

  if (club.joinPolicy === 'approval_required') {
    return 'Entrada por aprovacao';
  }

  return 'Apenas convite';
}

export default function ClubHeaderCard({ club, colors }: Props) {
  const iconName = getClubIconName(club);
  const statusColors = getBadgeColors(colors, getStatusTone(club));
  const visibilityColors = getBadgeColors(colors, 'neutral');
  const membershipColors = getBadgeColors(
    colors,
    club.viewerMembership.isMember ? 'green' : 'neutral',
  );

  return (
    <View
      testID="club-header-card"
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={[styles.cover, { backgroundColor: colors.greenSoft }]}>
        {club.coverUrl ? (
          <Image
            source={{ uri: club.coverUrl }}
            resizeMode="cover"
            style={styles.coverImage}
          />
        ) : (
          <View style={styles.coverPattern}>
            <MaterialIcons name="auto-awesome" size={20} color={colors.green} />
            <Text style={[styles.coverText, { color: colors.green }]}>
              {getJoinPolicyLabel(club)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.identityRow}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: club.status === 'active'
                ? colors.green
                : colors.surfaceStrong,
              borderColor: colors.surface,
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

        <View style={styles.titleStack}>
          <Text
            numberOfLines={2}
            testID="club-header-name"
            style={[styles.name, { color: colors.text }]}
          >
            {club.name}
          </Text>

          <Text
            numberOfLines={3}
            style={[styles.description, { color: colors.subText }]}
          >
            {club.description}
          </Text>
        </View>
      </View>

      <View style={styles.badgeGrid}>
        <Badge
          label={club.statusLabel}
          backgroundColor={statusColors.backgroundColor}
          color={statusColors.color}
        />
        <Badge
          label={club.visibilityLabel}
          backgroundColor={visibilityColors.backgroundColor}
          color={visibilityColors.color}
        />
        <Badge
          label={club.membershipLabel}
          backgroundColor={membershipColors.backgroundColor}
          color={membershipColors.color}
        />
      </View>

      {club.tags.length > 0 ? (
        <View testID="club-header-tags" style={styles.tagGrid}>
          {club.tags.map((tag) => (
            <View
              key={tag}
              style={[
                styles.tagChip,
                {
                  backgroundColor: colors.surfaceSoft,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[styles.tagText, { color: colors.subText }]}
              >
                #{tag}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.statsGrid}>
        <StatTile
          colors={colors}
          iconName="groups"
          label="Membros"
          value={club.membersLabel}
        />
        <StatTile
          colors={colors}
          iconName="forum"
          label="Prompts"
          value={club.promptsLabel}
        />
        <StatTile
          colors={colors}
          iconName="verified-user"
          label="Seu papel"
          value={club.membershipLabel}
        />
      </View>
    </View>
  );
}

type BadgeProps = {
  label: string;
  backgroundColor: string;
  color: string;
};

function Badge({ label, backgroundColor, color }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text numberOfLines={1} style={[styles.badgeText, { color }]}>
        {label}
      </Text>
    </View>
  );
}

type StatTileProps = {
  colors: ClubsThemeColors;
  iconName: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
};

function StatTile({ colors, iconName, label, value }: StatTileProps) {
  return (
    <View
      style={[
        styles.statTile,
        {
          backgroundColor: colors.surfaceSoft,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <MaterialIcons name={iconName} size={18} color={colors.green} />
      <Text numberOfLines={1} style={[styles.statValue, { color: colors.text }]}>
        {value}
      </Text>
      <Text numberOfLines={1} style={[styles.statLabel, { color: colors.muted }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cover: {
    height: 118,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPattern: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  coverText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  identityRow: {
    marginTop: -34,
    paddingHorizontal: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-end',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 22,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  titleStack: {
    flex: 1,
    paddingBottom: 3,
    gap: 6,
  },
  name: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  badgeGrid: {
    paddingHorizontal: 18,
    paddingTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    minHeight: 28,
    maxWidth: '100%',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  tagGrid: {
    paddingHorizontal: 18,
    paddingTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    minHeight: 30,
    maxWidth: '48%',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
  },
  statsGrid: {
    padding: 18,
    flexDirection: 'row',
    gap: 8,
  },
  statTile: {
    flex: 1,
    minHeight: 86,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 8,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
