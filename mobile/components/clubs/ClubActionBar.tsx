import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ClubsThemeColors } from '../../constants/clubsTheme';
import type { ClubDetail, ClubDetailActionKey } from '../../types/clubs';

type Props = {
  club: ClubDetail;
  colors: ClubsThemeColors;
  pendingAction: ClubDetailActionKey | null;
  isMuted: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onInvite: () => void;
  onPostPrompt: () => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onReportClub: () => void;
};

type ActionButtonProps = {
  colors: ClubsThemeColors;
  iconName: keyof typeof MaterialIcons.glyphMap;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  secondary?: boolean;
  testID: string;
  onPress: () => void;
};

function getJoinLabel(club: ClubDetail, isPending: boolean) {
  if (isPending) {
    return club.joinPolicy === 'approval_required'
      ? 'Solicitando...'
      : 'Entrando...';
  }

  if (club.viewerMembership.status === 'requested') {
    return 'Solicitado';
  }

  if (club.viewerMembership.status === 'invited') {
    return 'Convite recebido';
  }

  if (club.viewerMembership.status === 'removed') {
    return 'Acesso removido';
  }

  if (club.viewerMembership.status === 'blocked') {
    return 'Bloqueado';
  }

  if (club.joinPolicy === 'approval_required') {
    return 'Solicitar entrada';
  }

  if (club.joinPolicy === 'invite_only') {
    return 'Convite necessario';
  }

  return 'Entrar';
}

export default function ClubActionBar({
  club,
  colors,
  pendingAction,
  isMuted,
  onJoin,
  onLeave,
  onInvite,
  onPostPrompt,
  onToggleMute,
  onOpenSettings,
  onReportClub,
}: Props) {
  const isActive = club.status === 'active';
  const isMember = club.viewerMembership.isMember;
  const isJoinPending =
    pendingAction === 'join' || pendingAction === 'join-request';
  const joinDisabled =
    !isActive ||
    isJoinPending ||
    isMember ||
    club.viewerMembership.status === 'requested' ||
    club.viewerMembership.status === 'invited' ||
    club.viewerMembership.status === 'removed' ||
    club.viewerMembership.status === 'blocked' ||
    club.joinPolicy === 'invite_only';

  return (
    <View
      testID="club-action-bar"
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.actionsGrid}>
        {!isMember ? (
          <ActionButton
            colors={colors}
            iconName={
              club.joinPolicy === 'approval_required'
                ? 'how-to-reg'
                : 'login'
            }
            label={getJoinLabel(club, isJoinPending)}
            disabled={joinDisabled}
            testID="club-action-join"
            onPress={onJoin}
          />
        ) : null}

        {club.permissions.canPostPrompt ? (
          <ActionButton
            colors={colors}
            iconName="add-comment"
            label={pendingAction === 'prompt' ? 'Postando...' : 'Postar'}
            disabled={!isActive || pendingAction === 'prompt'}
            testID="club-action-post"
            onPress={onPostPrompt}
          />
        ) : null}

        {club.permissions.canInviteMembers ? (
          <ActionButton
            colors={colors}
            iconName="person-add"
            label="Convidar"
            disabled={!isActive}
            secondary
            testID="club-action-invite"
            onPress={onInvite}
          />
        ) : null}

        {isMember ? (
          <ActionButton
            colors={colors}
            iconName={isMuted ? 'notifications-active' : 'notifications-off'}
            label={
              pendingAction === 'mute' || pendingAction === 'unmute'
                ? 'Salvando...'
                : isMuted
                  ? 'Desmutar'
                  : 'Silenciar'
            }
            disabled={
              !isActive ||
              pendingAction === 'mute' ||
              pendingAction === 'unmute'
            }
            secondary
            testID="club-action-mute"
            onPress={onToggleMute}
          />
        ) : null}

        {isMember ? (
          <ActionButton
            colors={colors}
            iconName="logout"
            label={pendingAction === 'leave' ? 'Saindo...' : 'Sair'}
            disabled={!isActive || pendingAction === 'leave'}
            danger
            secondary
            testID="club-action-leave"
            onPress={onLeave}
          />
        ) : null}

        {club.permissions.canEditClub ? (
          <ActionButton
            colors={colors}
            iconName="settings"
            label="Configuracoes"
            disabled={!isActive}
            secondary
            testID="club-action-settings"
            onPress={onOpenSettings}
          />
        ) : null}

        {isActive ? (
          <ActionButton
            colors={colors}
            iconName="flag"
            label="Denunciar"
            disabled={pendingAction === 'report'}
            danger
            secondary
            testID="club-action-report"
            onPress={onReportClub}
          />
        ) : null}
      </View>
    </View>
  );
}

function ActionButton({
  colors,
  iconName,
  label,
  disabled = false,
  danger = false,
  secondary = false,
  testID,
  onPress,
}: ActionButtonProps) {
  const buttonBackground = disabled
    ? colors.surfaceStrong
    : secondary
      ? colors.surfaceSoft
      : danger
        ? colors.red
        : colors.green;
  const contentColor = disabled
    ? colors.muted
    : secondary
      ? danger
        ? colors.red
        : colors.green
      : colors.white;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: buttonBackground,
          borderColor: secondary ? colors.cardBorder : buttonBackground,
        },
        pressed && !disabled && styles.pressed,
      ]}
    >
      <MaterialIcons name={iconName} size={18} color={contentColor} />
      <Text numberOfLines={1} style={[styles.actionText, { color: contentColor }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    minHeight: 44,
    maxWidth: '100%',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  actionText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});
