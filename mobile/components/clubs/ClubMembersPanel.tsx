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
import type { ClubMembersScreenState } from '../../types/clubs';
import type {
  ClubMemberApi,
  ClubMemberRoleApi,
  ClubMemberStatusApi,
} from '../../types/clubsApi';
import ClubMemberRow from './ClubMemberRow';

type Props = {
  colors: ClubsThemeColors;
  members: ClubMembersScreenState;
  canManageMembers?: boolean;
  viewerRole?: ClubMemberRoleApi | null;
  restrictingUserId?: string | null;
  onBlockMember?: (member: ClubMemberApi) => void;
  onSuspendMemberPosting?: (member: ClubMemberApi) => void;
};

const ROLE_OPTIONS: { label: string; value: ClubMemberRoleApi | null }[] = [
  { label: 'Todos', value: null },
  { label: 'Owner', value: 'owner' },
  { label: 'Admin', value: 'admin' },
  { label: 'Mod', value: 'moderator' },
  { label: 'Membro', value: 'member' },
];

const STATUS_OPTIONS: {
  label: string;
  value: ClubMemberStatusApi | null;
}[] = [
  { label: 'Todos', value: null },
  { label: 'Ativos', value: 'active' },
  { label: 'Convites', value: 'invited' },
  { label: 'Pedidos', value: 'requested' },
  { label: 'Removidos', value: 'removed' },
  { label: 'Bloqueados', value: 'blocked' },
];

function getRoleRank(role: ClubMemberRoleApi | null | undefined) {
  if (role === 'owner') return 4;
  if (role === 'admin') return 3;
  if (role === 'moderator') return 2;
  if (role === 'member') return 1;
  return 0;
}

function canModerateMember({
  canManageMembers,
  viewerRole,
  member,
}: {
  canManageMembers: boolean;
  viewerRole: ClubMemberRoleApi | null | undefined;
  member: ClubMemberApi;
}) {
  if (!canManageMembers || member.status !== 'active') {
    return false;
  }

  if (viewerRole !== 'owner' && viewerRole !== 'admin') {
    return false;
  }

  if (member.role === 'owner') {
    return false;
  }

  return getRoleRank(member.role) < getRoleRank(viewerRole);
}

export default function ClubMembersPanel({
  colors,
  members,
  canManageMembers = false,
  viewerRole = null,
  restrictingUserId = null,
  onBlockMember,
  onSuspendMemberPosting,
}: Props) {
  if (members.contentState === 'access-denied') {
    return (
      <StatePanel
        colors={colors}
        iconName="lock-outline"
        testID="club-members-access-denied"
        title="Membros indisponiveis"
        description="Voce nao tem permissao para visualizar a lista de membros deste clube."
      />
    );
  }

  if (members.contentState === 'idle' || members.contentState === 'loading') {
    return (
      <StatePanel
        colors={colors}
        iconName="groups"
        testID="club-members-loading"
        title="Carregando membros"
        description="Buscando a lista real de membros do clube."
        isLoading
      />
    );
  }

  if (members.contentState === 'error') {
    return (
      <StatePanel
        colors={colors}
        iconName="wifi-off"
        testID="club-members-error"
        title="Nao foi possivel carregar membros"
        description={
          members.errorMessage ??
          'Verifique sua conexao e tente carregar a lista novamente.'
        }
        actionLabel="Tentar novamente"
        actionDisabled={!members.canRetry}
        onAction={() => {
          void members.handleRetry();
        }}
      />
    );
  }

  return (
    <View testID="club-members-panel" style={styles.stack}>
      <View style={styles.headerRow}>
        <View style={styles.titleStack}>
          <Text style={[styles.title, { color: colors.text }]}>
            Membros do clube
          </Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            {getMembersSummary(members)}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: members.isRefreshing }}
          disabled={members.isRefreshing}
          testID="club-members-refresh"
          onPress={() => {
            void members.handleRefresh();
          }}
          style={({ pressed }) => [
            styles.refreshButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
            pressed && !members.isRefreshing && styles.pressed,
          ]}
        >
          {members.isRefreshing ? (
            <ActivityIndicator size="small" color={colors.green} />
          ) : (
            <MaterialIcons name="refresh" size={18} color={colors.green} />
          )}
        </Pressable>
      </View>

      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <MaterialIcons name="search" size={18} color={colors.muted} />
        <TextInput
          value={members.searchQuery}
          onChangeText={members.setSearchQuery}
          placeholder="Buscar por nome ou username"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <FilterGroup
        colors={colors}
        label="Papel"
        options={ROLE_OPTIONS}
        activeValue={members.roleFilter}
        onChange={members.setRoleFilter}
        testIDPrefix="club-members-role-filter"
      />

      <FilterGroup
        colors={colors}
        label="Status"
        options={STATUS_OPTIONS}
        activeValue={members.statusFilter}
        onChange={members.setStatusFilter}
        testIDPrefix="club-members-status-filter"
      />

      {members.errorMessage && members.items.length > 0 ? (
        <View
          testID="club-members-refresh-error"
          style={[
            styles.feedbackBanner,
            {
              backgroundColor: colors.redSoft,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.feedbackText, { color: colors.red }]}>
            {members.errorMessage}
          </Text>
        </View>
      ) : null}

      {members.contentState === 'empty' ? (
        <StatePanel
          colors={colors}
          iconName="person-search"
          testID="club-members-empty"
          title="Nenhum membro encontrado"
          description="A consulta real de membros nao retornou pessoas para os filtros atuais."
        />
      ) : (
        members.items.map((member) => (
          <ClubMemberRow
            key={member.id}
            member={member}
            colors={colors}
            canModerate={canModerateMember({
              canManageMembers,
              viewerRole,
              member,
            })}
            isRestricting={restrictingUserId === member.userId}
            onBlock={onBlockMember}
            onSuspendPosting={onSuspendMemberPosting}
          />
        ))
      )}

      {members.canLoadMore ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: members.isLoadingMore }}
          disabled={members.isLoadingMore}
          testID="club-members-load-more"
          onPress={() => {
            void members.handleLoadMore();
          }}
          style={({ pressed }) => [
            styles.loadMoreButton,
            { backgroundColor: colors.green },
            pressed && !members.isLoadingMore && styles.pressed,
          ]}
        >
          {members.isLoadingMore ? (
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

function getMembersSummary(members: ClubMembersScreenState) {
  if (!members.pagination) {
    return `${members.items.length} membros carregados`;
  }

  const total = members.pagination.total;
  const visible = members.items.length;

  return `${visible} de ${total} membros`;
}

type FilterOption<T extends string | null> = {
  label: string;
  value: T;
};

type FilterGroupProps<T extends string | null> = {
  colors: ClubsThemeColors;
  label: string;
  options: FilterOption<T>[];
  activeValue: T;
  onChange: (value: T) => void;
  testIDPrefix: string;
};

function FilterGroup<T extends string | null>({
  colors,
  label,
  options,
  activeValue,
  onChange,
  testIDPrefix,
}: FilterGroupProps<T>) {
  return (
    <View style={styles.filterGroup}>
      <Text style={[styles.filterLabel, { color: colors.subText }]}>{label}</Text>
      <View style={styles.filterRow}>
        {options.map((option) => {
          const isActive = option.value === activeValue;
          const optionKey = option.value ?? 'all';

          return (
            <Pressable
              key={optionKey}
              accessibilityRole="button"
              testID={`${testIDPrefix}-${optionKey}`}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.filterChip,
                {
                  backgroundColor: isActive ? colors.green : colors.surface,
                  borderColor: isActive ? colors.green : colors.cardBorder,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.filterChipText,
                  { color: isActive ? colors.white : colors.text },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
          <MaterialIcons name="refresh" size={17} color={colors.white} />
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
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    minHeight: 34,
    maxWidth: '100%',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 11,
    lineHeight: 14,
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
  loadMoreButton: {
    minHeight: 42,
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
  pressed: {
    opacity: 0.88,
  },
});
