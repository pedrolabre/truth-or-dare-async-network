import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { ClubsThemeColors } from '../../constants/clubsTheme';
import type { ClubDetailContentState } from '../../types/clubs';

type Props = {
  colors: ClubsThemeColors;
  state: Exclude<ClubDetailContentState, 'ready'>;
  errorMessage?: string | null;
  onRetry?: () => void;
};

type StateContent = {
  title: string;
  description: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  tone: 'neutral' | 'warning' | 'danger';
  actionLabel?: string;
};

function getStateContent(
  state: Props['state'],
  errorMessage?: string | null,
): StateContent {
  switch (state) {
    case 'loading':
      return {
        title: 'Carregando clube',
        description: 'Buscando os detalhes atualizados.',
        iconName: 'groups',
        tone: 'neutral',
      };
    case 'invalid-id':
      return {
        title: 'Clube invalido',
        description: 'Nao encontramos um id valido para abrir este clube.',
        iconName: 'link-off',
        tone: 'danger',
      };
    case 'access-denied':
      return {
        title: 'Clube privado',
        description:
          errorMessage ??
          'Voce nao tem acesso a este clube no momento.',
        iconName: 'lock-outline',
        tone: 'warning',
        actionLabel: 'Tentar novamente',
      };
    case 'not-found':
      return {
        title: 'Clube nao encontrado',
        description:
          errorMessage ??
          'Ele pode ter sido removido ou nao existir mais.',
        iconName: 'search-off',
        tone: 'danger',
        actionLabel: 'Tentar novamente',
      };
    case 'archived':
      return {
        title: 'Clube arquivado',
        description:
          'Este clube esta arquivado e algumas acoes podem estar indisponiveis.',
        iconName: 'inventory-2',
        tone: 'warning',
      };
    case 'suspended':
      return {
        title: 'Clube suspenso',
        description:
          'Este clube esta temporariamente indisponivel.',
        iconName: 'block',
        tone: 'danger',
      };
    case 'error':
    default:
      return {
        title: 'Nao foi possivel carregar o clube',
        description: errorMessage ?? 'Verifique sua conexao e tente novamente.',
        iconName: 'wifi-off',
        tone: 'danger',
        actionLabel: 'Tentar novamente',
      };
  }
}

function getToneColor(colors: ClubsThemeColors, tone: StateContent['tone']) {
  if (tone === 'danger') {
    return colors.red;
  }

  if (tone === 'warning') {
    return colors.green;
  }

  return colors.muted;
}

function getToneBackground(
  colors: ClubsThemeColors,
  tone: StateContent['tone'],
) {
  if (tone === 'danger') {
    return colors.redSoft;
  }

  if (tone === 'warning') {
    return colors.greenSoft;
  }

  return colors.surfaceSoft;
}

export default function ClubDetailStateCard({
  colors,
  state,
  errorMessage,
  onRetry,
}: Props) {
  const content = getStateContent(state, errorMessage);
  const iconColor = getToneColor(colors, content.tone);
  const iconBackground = getToneBackground(colors, content.tone);
  const shouldShowRetry = Boolean(content.actionLabel && onRetry);

  return (
    <View
      testID="club-detail-state-card"
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
        {state === 'loading' ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <MaterialIcons name={content.iconName} size={28} color={iconColor} />
        )}
      </View>

      <Text
        testID="club-detail-state-title"
        style={[styles.title, { color: colors.text }]}
      >
        {content.title}
      </Text>

      <Text style={[styles.description, { color: colors.subText }]}>
        {content.description}
      </Text>

      {shouldShowRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={content.actionLabel}
          testID="club-detail-retry"
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryButton,
            { backgroundColor: colors.green },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.retryText, { color: colors.white }]}>
            {content.actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  description: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    maxWidth: 292,
  },
  retryButton: {
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.9,
  },
});
