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
import type { ClubFeedScreenState } from '../../types/clubs';
import ClubPromptCard from './ClubPromptCard';

type Props = {
  colors: ClubsThemeColors;
  feed: ClubFeedScreenState;
};

export default function ClubFeedPanel({ colors, feed }: Props) {
  if (feed.contentState === 'access-denied') {
    return (
      <StatePanel
        colors={colors}
        iconName="lock-outline"
        testID="club-feed-access-unavailable"
        title="Feed indisponivel"
        description="Voce nao tem permissao para visualizar os prompts deste clube."
      />
    );
  }

  if (feed.contentState === 'idle' || feed.contentState === 'loading') {
    return (
      <StatePanel
        colors={colors}
        iconName="dynamic-feed"
        testID="club-feed-loading"
        title="Carregando feed"
        description="Buscando os prompts publicados neste clube."
        isLoading
      />
    );
  }

  if (feed.contentState === 'error') {
    return (
      <StatePanel
        colors={colors}
        iconName="wifi-off"
        testID="club-feed-error"
        title="Nao foi possivel carregar o feed"
        description={
          feed.errorMessage ??
          'Verifique sua conexao e tente carregar os prompts novamente.'
        }
        actionLabel="Tentar novamente"
        actionDisabled={!feed.canRetry}
        onAction={() => {
          void feed.handleRetry();
        }}
      />
    );
  }

  if (feed.contentState === 'empty') {
    return (
      <View testID="club-feed-empty" style={styles.stack}>
        <StatePanel
          colors={colors}
          iconName="forum"
          testID="club-feed-empty-card"
          title="Nenhum prompt publicado"
          description="Quando membros publicarem verdades ou desafios, eles aparecerao aqui com os dados reais do clube."
          actionLabel="Atualizar feed"
          actionDisabled={feed.isRefreshing}
          isActionLoading={feed.isRefreshing}
          onAction={() => {
            void feed.handleRefresh();
          }}
        />
        <PaginationNotice colors={colors} />
      </View>
    );
  }

  return (
    <View testID="club-feed-panel" style={styles.stack}>
      <View style={styles.feedHeader}>
        <View style={styles.feedTitleStack}>
          <Text style={[styles.feedTitle, { color: colors.text }]}>
            Prompts do clube
          </Text>
          <Text style={[styles.feedSubtitle, { color: colors.subText }]}>
            {feed.items.length === 1
              ? '1 prompt carregado'
              : `${feed.items.length} prompts carregados`}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: feed.isRefreshing }}
          disabled={feed.isRefreshing}
          testID="club-feed-refresh"
          onPress={() => {
            void feed.handleRefresh();
          }}
          style={({ pressed }) => [
            styles.refreshButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
            pressed && !feed.isRefreshing && styles.pressed,
          ]}
        >
          {feed.isRefreshing ? (
            <ActivityIndicator size="small" color={colors.green} />
          ) : (
            <MaterialIcons name="refresh" size={18} color={colors.green} />
          )}
          <Text style={[styles.refreshText, { color: colors.green }]}>
            Atualizar
          </Text>
        </Pressable>
      </View>

      {feed.errorMessage ? (
        <View
          testID="club-feed-refresh-error"
          style={[
            styles.feedbackBanner,
            {
              backgroundColor: colors.redSoft,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.feedbackText, { color: colors.red }]}>
            {feed.errorMessage}
          </Text>
        </View>
      ) : null}

      {feed.items.map((item) => (
        <ClubPromptCard key={item.id} item={item} colors={colors} />
      ))}

      <PaginationNotice colors={colors} />
    </View>
  );
}

type StatePanelProps = {
  colors: ClubsThemeColors;
  iconName: keyof typeof MaterialIcons.glyphMap;
  testID: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionDisabled?: boolean;
  isActionLoading?: boolean;
  isLoading?: boolean;
  onAction?: () => void;
};

function StatePanel({
  colors,
  iconName,
  testID,
  title,
  description,
  actionLabel,
  actionDisabled = false,
  isActionLoading = false,
  isLoading = false,
  onAction,
}: StatePanelProps) {
  return (
    <View
      testID={testID}
      style={[
        styles.stateCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.greenSoft }]}>
        {isLoading ? (
          <ActivityIndicator color={colors.green} />
        ) : (
          <MaterialIcons name={iconName} size={30} color={colors.green} />
        )}
      </View>

      <Text style={[styles.stateTitle, { color: colors.text }]}>{title}</Text>

      <Text style={[styles.stateDescription, { color: colors.subText }]}>
        {description}
      </Text>

      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: actionDisabled }}
          disabled={actionDisabled}
          onPress={onAction}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: actionDisabled
                ? colors.surfaceStrong
                : colors.green,
            },
            pressed && !actionDisabled && styles.pressed,
          ]}
        >
          {isActionLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <MaterialIcons name="refresh" size={17} color={colors.white} />
          )}
          <Text style={[styles.actionText, { color: colors.white }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function PaginationNotice({ colors }: { colors: ClubsThemeColors }) {
  return (
    <View
      testID="club-feed-pagination-notice"
      style={[
        styles.notice,
        {
          backgroundColor: colors.surfaceSoft,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <MaterialIcons name="info-outline" size={17} color={colors.muted} />
      <Text style={[styles.noticeText, { color: colors.subText }]}>
        O endpoint atual retorna a lista disponivel de prompts do clube sem
        paginacao real.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  feedTitleStack: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  feedTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  feedSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  refreshButton: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  refreshText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  stateCard: {
    borderWidth: 1,
    borderRadius: 22,
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
  stateTitle: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  stateDescription: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    maxWidth: 292,
  },
  actionButton: {
    minHeight: 42,
    borderRadius: 999,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  actionText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  feedbackBanner: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  notice: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
});
