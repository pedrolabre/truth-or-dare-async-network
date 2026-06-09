import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { PublicProfileClub } from '../../types/user';

type Props = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  subTextColor: string;
  iconColor: string;
  clubs?: PublicProfileClub[];
  title?: string;
  emptyDescription?: string;
  onPressClub?: (club: PublicProfileClub) => void;
};

function resolveClubIcon(
  iconName: string | null | undefined,
): keyof typeof MaterialIcons.glyphMap {
  const glyphMap = MaterialIcons.glyphMap as Record<string, unknown> | undefined;

  if (iconName?.trim() && glyphMap?.[iconName]) {
    return iconName as keyof typeof MaterialIcons.glyphMap;
  }

  return 'groups';
}

function getMembersLabel(memberCount: number) {
  if (memberCount === 1) {
    return '1 membro';
  }

  return `${memberCount} membros`;
}

function getPublicClubsLabel(count: number) {
  if (count === 1) {
    return '1 clube publico';
  }

  return `${count} clubes publicos`;
}

export default function ProfileClubCard({
  backgroundColor,
  borderColor,
  textColor,
  subTextColor,
  iconColor,
  clubs = [],
  title = 'Meus Clubes',
  emptyDescription = 'Quando voce criar ou participar de clubes publicos, eles aparecerao aqui.',
  onPressClub,
}: Props) {
  const hasClubs = clubs.length > 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor}1A` }]}>
          <MaterialIcons name="groups" size={24} color={iconColor} />
        </View>

        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            {hasClubs ? getPublicClubsLabel(clubs.length) : emptyDescription}
          </Text>
        </View>
      </View>

      {hasClubs ? (
        <View style={[styles.clubList, { borderTopColor: borderColor }]}>
          {clubs.map((club) => {
            const trimmedAvatarUrl = club.avatarUrl?.trim();
            const description = club.description?.trim();

            return (
              <Pressable
                key={club.id}
                accessibilityRole="button"
                accessibilityLabel={`Abrir clube ${club.name}`}
                onPress={() => onPressClub?.(club)}
                style={({ pressed }) => [
                  styles.clubRow,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.clubAvatar,
                    { backgroundColor: `${iconColor}1A` },
                  ]}
                >
                  {trimmedAvatarUrl ? (
                    <Image
                      accessibilityIgnoresInvertColors
                      source={{ uri: trimmedAvatarUrl }}
                      style={styles.clubAvatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <MaterialIcons
                      name={resolveClubIcon(club.iconName)}
                      size={22}
                      color={iconColor}
                    />
                  )}
                </View>

                <View style={styles.clubTextWrap}>
                  <Text
                    numberOfLines={1}
                    style={[styles.clubName, { color: textColor }]}
                  >
                    {club.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.clubMeta, { color: subTextColor }]}
                  >
                    {description
                      ? `${getMembersLabel(club.memberCount)} - ${description}`
                      : getMembersLabel(club.memberCount)}
                  </Text>
                </View>

                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={subTextColor}
                />
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 84,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  clubList: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 4,
  },
  clubRow: {
    minHeight: 58,
    borderRadius: 16,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  clubAvatarImage: {
    width: '100%',
    height: '100%',
  },
  clubTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  clubName: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  clubMeta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
});
