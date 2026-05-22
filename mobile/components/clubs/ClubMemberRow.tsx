import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
};

export default function ClubMemberRow({ member, colors }: Props) {
  const username = member.username ? `@${member.username}` : 'Sem username';

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
      </View>
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
});
