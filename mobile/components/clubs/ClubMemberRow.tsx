import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ClubsThemeColors } from '../../constants/clubsTheme';
import type {
  ClubMemberApi,
  ClubMemberRoleApi,
  ClubMemberStatusApi,
} from '../../types/clubsApi';

const ROLE_LABELS: Record<ClubMemberRoleApi, string> = {
  owner: 'Dono',
  admin: 'Admin',
  moderator: 'Moderador',
  member: 'Membro',
};

const STATUS_LABELS: Record<ClubMemberStatusApi, string> = {
  active: 'Ativo',
  invited: 'Convidado',
  requested: 'Pendente',
  removed: 'Removido',
  blocked: 'Bloqueado',
};

function getDateLabel(value: string | null) {
  if (!value) {
    return 'Sem entrada registrada';
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (!match) {
    return value;
  }

  const [, year, month, day] = match;

  return `${day}/${month}/${year}`;
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '?';
  const second = words[1]?.[0] ?? '';

  return `${first}${second}`.toUpperCase();
}

type Props = {
  member: ClubMemberApi;
  colors: ClubsThemeColors;
  canModerate?: boolean;
  isRestricting?: boolean;
  onBlock?: (member: ClubMemberApi) => void;
  onSuspendPosting?: (member: ClubMemberApi) => void;
};

export default function ClubMemberRow({
  member,
  colors,
  canModerate = false,
  isRestricting = false,
  onBlock,
  onSuspendPosting,
}: Props) {
  const username = member.username ? `@${member.username}` : 'Sem username';
  const hasPostingSuspension = Boolean(member.postingSuspendedUntil);
  const canShowModerationActions =
    canModerate && member.status === 'active' && member.role !== 'owner';

  return (
    <View
      testID={`club-member-row-${member.userId}`}
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.greenSoft }]}>
        <Text style={[styles.avatarText, { color: colors.green }]}>
          {getInitials(member.name)}
        </Text>
      </View>

      <View style={styles.identityStack}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
          {member.name}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.username, { color: colors.subText }]}
        >
          {username}
        </Text>
        <View style={styles.metaRow}>
          <MaterialIcons name="event-available" size={14} color={colors.muted} />
          <Text numberOfLines={1} style={[styles.metaText, { color: colors.muted }]}>
            Entrou em {getDateLabel(member.joinedAt)}
          </Text>
        </View>
      </View>

      <View style={styles.badgesStack}>
        <View style={[styles.badge, { backgroundColor: colors.greenSoft }]}>
          <Text numberOfLines={1} style={[styles.badgeText, { color: colors.green }]}>
            {ROLE_LABELS[member.role]}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.surfaceSoft }]}>
          <Text numberOfLines={1} style={[styles.badgeText, { color: colors.muted }]}>
            {STATUS_LABELS[member.status]}
          </Text>
        </View>
        {hasPostingSuspension ? (
          <View style={[styles.badge, { backgroundColor: colors.redSoft }]}>
            <Text numberOfLines={1} style={[styles.badgeText, { color: colors.red }]}>
              Suspenso
            </Text>
          </View>
        ) : null}
      </View>

      {canShowModerationActions ? (
        <View style={styles.moderationActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isRestricting }}
            disabled={isRestricting}
            testID={`club-member-suspend-${member.userId}`}
            onPress={() => onSuspendPosting?.(member)}
            style={({ pressed }) => [
              styles.moderationButton,
              {
                backgroundColor: colors.surfaceSoft,
                borderColor: colors.cardBorder,
              },
              pressed && !isRestricting && styles.pressed,
              isRestricting && styles.disabled,
            ]}
          >
            <MaterialIcons name="timer-off" size={15} color={colors.green} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isRestricting }}
            disabled={isRestricting}
            testID={`club-member-block-${member.userId}`}
            onPress={() => onBlock?.(member)}
            style={({ pressed }) => [
              styles.moderationButton,
              {
                backgroundColor: colors.redSoft,
                borderColor: colors.cardBorder,
              },
              pressed && !isRestricting && styles.pressed,
              isRestricting && styles.disabled,
            ]}
          >
            <MaterialIcons name="block" size={15} color={colors.red} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  identityStack: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  name: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  username: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  badgesStack: {
    maxWidth: 104,
    alignItems: 'flex-end',
    gap: 6,
  },
  moderationActions: {
    gap: 6,
  },
  moderationButton: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    minHeight: 26,
    borderRadius: 999,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.86,
  },
});
