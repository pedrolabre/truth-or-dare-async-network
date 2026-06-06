import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { ClubsThemeColors } from '../../constants/clubsTheme';
import type {
  ClubAuditLogItem,
  ClubAuditLogScreenState,
} from '../../types/clubs';

type Props = {
  colors: ClubsThemeColors;
  auditLog: ClubAuditLogScreenState;
};

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

export default function ClubAuditLogPanel({ colors, auditLog }: Props) {
  if (auditLog.contentState === 'access-denied') {
    return (
      <StatePanel
        colors={colors}
        iconName="lock-outline"
        testID="club-audit-access-denied"
        title="Auditoria indisponivel"
        description="A auditoria do clube fica disponivel apenas para owner e admin."
      />
    );
  }

  if (auditLog.contentState === 'idle' || auditLog.contentState === 'loading') {
    return (
      <View testID="club-audit-loading" style={styles.stack}>
        <StatePanel
          colors={colors}
          iconName="manage-search"
          testID="club-audit-loading-card"
          title="Carregando auditoria"
          description="Buscando eventos reais de auditoria do clube."
          isLoading
        />
        <AuditSkeleton colors={colors} />
      </View>
    );
  }

  if (auditLog.contentState === 'error') {
    return (
      <StatePanel
        colors={colors}
        iconName="wifi-off"
        testID="club-audit-error"
        title="Nao foi possivel carregar auditoria"
        description={
          auditLog.errorMessage ??
          'Verifique sua conexao e tente carregar os eventos novamente.'
        }
        actionLabel="Tentar novamente"
        actionDisabled={!auditLog.canRetry}
        onAction={() => {
          void auditLog.handleRetry();
        }}
      />
    );
  }

  return (
    <View testID="club-audit-panel" style={styles.stack}>
      <View style={styles.headerRow}>
        <View style={styles.titleStack}>
          <Text style={[styles.title, { color: colors.text }]}>
            Auditoria do clube
          </Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            {getAuditSummary(auditLog)}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Atualizar auditoria do clube"
          accessibilityState={{ disabled: auditLog.isRefreshing }}
          disabled={auditLog.isRefreshing}
          testID="club-audit-refresh"
          onPress={() => {
            void auditLog.handleRefresh();
          }}
          style={({ pressed }) => [
            styles.refreshButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
            pressed && !auditLog.isRefreshing && styles.pressed,
          ]}
        >
          {auditLog.isRefreshing ? (
            <ActivityIndicator size="small" color={colors.green} />
          ) : (
            <MaterialIcons name="refresh" size={18} color={colors.green} />
          )}
        </Pressable>
      </View>

      <AuditFilters colors={colors} auditLog={auditLog} />

      {auditLog.errorMessage && auditLog.items.length > 0 ? (
        <View
          testID="club-audit-refresh-error"
          style={[
            styles.feedbackBanner,
            {
              backgroundColor: colors.redSoft,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.feedbackText, { color: colors.red }]}>
            {auditLog.errorMessage}
          </Text>
        </View>
      ) : null}

      {auditLog.contentState === 'empty' ? (
        <StatePanel
          colors={colors}
          iconName="history"
          testID="club-audit-empty"
          title="Nenhum evento encontrado"
          description="Nao ha eventos de auditoria visiveis para os filtros atuais."
          actionLabel="Limpar filtros"
          onAction={auditLog.clearFilters}
        />
      ) : (
        auditLog.items.map((item) => (
          <AuditItemCard key={item.id} item={item} colors={colors} />
        ))
      )}

      {auditLog.canLoadMore ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Carregar mais eventos de auditoria"
          accessibilityState={{ disabled: auditLog.isLoadingMore }}
          disabled={auditLog.isLoadingMore}
          testID="club-audit-load-more"
          onPress={() => {
            void auditLog.handleLoadMore();
          }}
          style={({ pressed }) => [
            styles.loadMoreButton,
            { backgroundColor: colors.green },
            pressed && !auditLog.isLoadingMore && styles.pressed,
          ]}
        >
          {auditLog.isLoadingMore ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <MaterialIcons name="expand-more" size={18} color={colors.white} />
          )}
          <Text style={[styles.loadMoreText, { color: colors.white }]}>
            Carregar mais
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function getAuditSummary(auditLog: ClubAuditLogScreenState) {
  const itemLabel = auditLog.items.length === 1 ? 'evento' : 'eventos';

  return `${auditLog.items.length} ${itemLabel} carregados`;
}

function AuditFilters({
  colors,
  auditLog,
}: {
  colors: ClubsThemeColors;
  auditLog: ClubAuditLogScreenState;
}) {
  return (
    <View
      testID="club-audit-filters"
      style={[
        styles.filtersCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.filterHeader}>
        <View style={styles.filterTitleRow}>
          <MaterialIcons name="filter-list" size={18} color={colors.green} />
          <Text style={[styles.filterTitle, { color: colors.text }]}>
            Filtros
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpar filtros de auditoria"
          testID="club-audit-clear-filters"
          onPress={auditLog.clearFilters}
          style={({ pressed }) => [
            styles.clearFilterButton,
            { backgroundColor: colors.surfaceSoft },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.clearFilterText, { color: colors.text }]}>
            Limpar
          </Text>
        </Pressable>
      </View>

      <View style={styles.inputGrid}>
        <AuditFilterInput
          colors={colors}
          label="Acao"
          accessibilityLabel="Filtrar auditoria por acao"
          value={auditLog.filters.action ?? ''}
          onChangeText={auditLog.setActionFilter}
        />
        <AuditFilterInput
          colors={colors}
          label="Entidade"
          accessibilityLabel="Filtrar auditoria por tipo de entidade"
          value={auditLog.filters.entityType ?? ''}
          onChangeText={auditLog.setEntityTypeFilter}
        />
        <AuditFilterInput
          colors={colors}
          label="Usuario alvo"
          accessibilityLabel="Filtrar auditoria por usuario alvo"
          value={auditLog.filters.targetUserId ?? ''}
          onChangeText={auditLog.setTargetUserIdFilter}
        />
        <AuditFilterInput
          colors={colors}
          label="De"
          accessibilityLabel="Filtrar auditoria a partir de data ISO"
          value={auditLog.filters.from ?? ''}
          onChangeText={auditLog.setFromFilter}
        />
        <AuditFilterInput
          colors={colors}
          label="Ate"
          accessibilityLabel="Filtrar auditoria ate data ISO"
          value={auditLog.filters.to ?? ''}
          onChangeText={auditLog.setToFilter}
        />
      </View>
    </View>
  );
}

function AuditFilterInput({
  colors,
  label,
  accessibilityLabel,
  value,
  onChangeText,
}: {
  colors: ClubsThemeColors;
  label: string;
  accessibilityLabel: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View
      style={[
        styles.filterInputWrap,
        {
          backgroundColor: colors.surfaceSoft,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <Text style={[styles.filterInputLabel, { color: colors.subText }]}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        placeholder="Opcional"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.filterInput, { color: colors.text }]}
      />
    </View>
  );
}

function AuditItemCard({
  item,
  colors,
}: {
  item: ClubAuditLogItem;
  colors: ClubsThemeColors;
}) {
  const accessibilityLabel = [
    item.actionLabel,
    item.createdAtLabel,
    item.actorLabel,
    item.targetLabel,
    item.entityLabel,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      testID={`club-audit-item-${item.id}`}
      style={[
        styles.auditCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.auditHeader}>
        <View style={[styles.auditIcon, { backgroundColor: colors.greenSoft }]}>
          <MaterialIcons name="history" size={20} color={colors.green} />
        </View>
        <View style={styles.auditTitleStack}>
          <Text style={[styles.auditTitle, { color: colors.text }]}>
            {item.actionLabel}
          </Text>
          <Text style={[styles.auditTime, { color: colors.subText }]}>
            {item.createdAtLabel}
          </Text>
        </View>
      </View>

      <View style={styles.auditMetaStack}>
        <AuditMetaLine label="Ator" value={item.actorLabel} colors={colors} />
        {item.targetLabel ? (
          <AuditMetaLine label="Alvo" value={item.targetLabel} colors={colors} />
        ) : null}
        {item.entityLabel ? (
          <AuditMetaLine
            label="Entidade"
            value={item.entityLabel}
            colors={colors}
          />
        ) : null}
      </View>

      <View style={styles.metadataStack}>
        {item.metadataEntries.length > 0 ? (
          item.metadataEntries.map((entry) => (
            <View
              key={`${item.id}-${entry.label}`}
              style={[
                styles.metadataChip,
                {
                  backgroundColor: colors.surfaceSoft,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.metadataLabel, { color: colors.muted }]}>
                {entry.label}
              </Text>
              <Text style={[styles.metadataValue, { color: colors.text }]}>
                {entry.value}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.noMetadataText, { color: colors.subText }]}>
            Sem detalhes adicionais.
          </Text>
        )}
      </View>
    </View>
  );
}

function AuditMetaLine({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ClubsThemeColors;
}) {
  return (
    <View style={styles.auditMetaLine}>
      <Text style={[styles.auditMetaLabel, { color: colors.muted }]}>
        {label}
      </Text>
      <Text style={[styles.auditMetaValue, { color: colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

function AuditSkeleton({ colors }: { colors: ClubsThemeColors }) {
  return (
    <View style={styles.skeletonStack}>
      {[0, 1, 2].map((item) => (
        <View
          key={item}
          style={[
            styles.skeletonCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={[styles.skeletonIcon, { backgroundColor: colors.surfaceStrong }]} />
          <View style={styles.skeletonLines}>
            <View style={[styles.skeletonLineWide, { backgroundColor: colors.surfaceStrong }]} />
            <View style={[styles.skeletonLineShort, { backgroundColor: colors.surfaceStrong }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

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

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleStack: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 12,
  },
  filterHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  filterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  filterTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  clearFilterButton: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearFilterText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  inputGrid: {
    gap: 10,
  },
  filterInputWrap: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 2,
  },
  filterInputLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  filterInput: {
    minHeight: 32,
    paddingVertical: 0,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
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
  auditCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  auditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  auditIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditTitleStack: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  auditTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
  },
  auditTime: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  auditMetaStack: {
    gap: 6,
  },
  auditMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  auditMetaLabel: {
    width: 72,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  auditMetaValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  metadataStack: {
    gap: 8,
  },
  metadataChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  metadataLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  metadataValue: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  noMetadataText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  loadMoreButton: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  loadMoreText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
  },
  skeletonStack: {
    gap: 10,
  },
  skeletonCard: {
    minHeight: 74,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skeletonIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
  },
  skeletonLines: {
    flex: 1,
    gap: 8,
  },
  skeletonLineWide: {
    height: 12,
    borderRadius: 999,
    width: '72%',
  },
  skeletonLineShort: {
    height: 10,
    borderRadius: 999,
    width: '46%',
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
    minHeight: 44,
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
  pressed: {
    opacity: 0.88,
  },
});
