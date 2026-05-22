import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ClubsThemeColors } from '../../constants/clubsTheme';
import type { ClubInviteUserOption } from '../../hooks/useClubInvites';

type Props = {
  colors: ClubsThemeColors;
  user: ClubInviteUserOption;
  isInviting: boolean;
  isInvited: boolean;
  onInvite: (userId: string) => void;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function ClubInviteUserRow({
  colors,
  user,
  isInviting,
  isInvited,
  onInvite,
}: Props) {
  const disabled = isInviting || isInvited;
  const actionLabel = isInviting
    ? 'Enviando...'
    : isInvited
      ? 'Enviado'
      : 'Convidar';

  return (
    <View testID={`club-invite-user-${user.id}`} style={styles.row}>
      <View style={styles.userLeft}>
        <View style={[styles.avatar, { backgroundColor: colors.green }]}>
          <Text style={[styles.avatarText, { color: colors.white }]}>
            {getInitials(user.name)}
          </Text>
        </View>

        <View style={styles.userTextWrap}>
          <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
            {user.name}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.email, { color: colors.subText }]}
          >
            {user.email}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => onInvite(user.id)}
        testID={`club-invite-send-${user.id}`}
        style={({ pressed }) => [
          styles.inviteButton,
          {
            backgroundColor: disabled ? colors.surfaceStrong : colors.green,
          },
          pressed && !disabled && styles.pressed,
        ]}
      >
        {isInvited ? (
          <MaterialIcons name="check" size={16} color={colors.green} />
        ) : null}
        <Text
          numberOfLines={1}
          style={[
            styles.inviteText,
            { color: disabled ? colors.muted : colors.white },
          ]}
        >
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  userLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '900',
  },
  userTextWrap: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 14,
    fontWeight: '900',
  },
  email: {
    fontSize: 12,
    fontWeight: '500',
  },
  inviteButton: {
    minHeight: 38,
    minWidth: 96,
    borderRadius: 999,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  inviteText: {
    fontSize: 12,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});
