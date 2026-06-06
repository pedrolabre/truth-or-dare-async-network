import type {
  ClubAuditLogItem,
  ClubAuditMetadataEntry,
  ClubDetail,
  ClubDiscoverItem,
  ClubListItem,
} from '../types/clubs';
import type {
  ClubAuditLogApi,
  ClubAuditMetadataApi,
  ClubDetailsApi,
  ClubMemberRoleApi,
  ClubMemberStatusApi,
  ClubPermissionsApi,
  ClubStatusApi,
  ClubViewerActivityApi,
  ClubSummaryApi,
  ClubVisibilityApi,
  DiscoverClubsApi,
} from '../types/clubsApi';

export type ClubDiscoverySource = keyof DiscoverClubsApi;
export type ClubDiscoverItemSource = ClubDiscoverySource | 'search';

const DEFAULT_CLUB_DESCRIPTION = 'Clube sem descrição por enquanto.';
const DEFAULT_CLUB_ICON_NAME = 'groups';
const MAX_AUDIT_METADATA_ENTRIES = 8;
const MAX_AUDIT_METADATA_ARRAY_ITEMS = 4;
const SENSITIVE_AUDIT_METADATA_KEY_PATTERN =
  /(authorization|password|passwordHash|resetToken|token|secret|email|code|raw|payload)/i;

const DISCOVERY_BADGE_LABELS: Record<ClubDiscoverItemSource, string> = {
  suggested: 'Sugestão',
  popular: 'Popular',
  recent: 'Novo',
  search: 'Busca',
};

const CLUB_STATUS_LABELS: Record<ClubStatusApi, string | undefined> = {
  active: undefined,
  archived: 'Arquivado',
  suspended: 'Suspenso',
  deleted: 'Removido',
};

const MEMBER_STATUS_LABELS: Record<ClubMemberStatusApi, string> = {
  active: 'Membro',
  invited: 'Convite',
  requested: 'Pendente',
  removed: 'Removido',
  blocked: 'Bloqueado',
};

const MEMBER_ROLE_LABELS: Record<ClubMemberRoleApi, string> = {
  owner: 'Dono',
  admin: 'Admin',
  moderator: 'Moderador',
  member: 'Membro',
};

const CLUB_VISIBILITY_LABELS: Record<ClubVisibilityApi, string> = {
  public: 'Publico',
  private: 'Privado',
  invite_only: 'Convite',
};

const CLUB_DETAIL_STATUS_LABELS: Record<ClubStatusApi, string> = {
  active: 'Ativo',
  archived: 'Arquivado',
  suspended: 'Suspenso',
  deleted: 'Removido',
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  club_created: 'Clube criado',
  club_invite_created: 'Convite criado',
  club_invite_accepted: 'Convite aceito',
  club_join_requested: 'Entrada solicitada',
  club_join_request_approved: 'Entrada aprovada',
  club_join_request_rejected: 'Entrada recusada',
  club_member_left: 'Membro saiu',
  club_member_removed: 'Membro removido',
  club_member_blocked: 'Membro bloqueado',
  club_member_role_updated: 'Papel alterado',
  club_member_posting_suspended: 'Postagem suspensa',
  club_prompt_created: 'Prompt criado',
  club_prompt_removed: 'Prompt removido',
  club_prompt_response_created: 'Resposta criada',
  club_prompt_comment_created: 'Comentario criado',
};

const AUDIT_ENTITY_LABELS: Record<string, string> = {
  club: 'Clube',
  club_invite: 'Convite',
  club_join_request: 'Solicitacao',
  club_member: 'Membro',
  club_prompt: 'Prompt',
  club_prompt_response: 'Resposta',
  club_prompt_comment: 'Comentario',
};

const AUDIT_METADATA_LABELS: Record<string, string> = {
  previousRole: 'Papel anterior',
  newRole: 'Novo papel',
  previousStatus: 'Status anterior',
  newStatus: 'Novo status',
  status: 'Status',
  reason: 'Motivo',
  hasMessage: 'Mensagem enviada',
  incrementedMemberCount: 'Contador incrementado',
  decrementedMemberCount: 'Contador reduzido',
  suspendedUntil: 'Suspenso ate',
  inviterId: 'Convidado por',
};

const BLOCKED_CLUB_DETAIL_PERMISSIONS: ClubPermissionsApi = {
  canViewFeed: false,
  canPostPrompt: false,
  canInviteMembers: false,
  canManageMembers: false,
  canEditClub: false,
  canArchiveClub: false,
  canTransferOwnership: false,
};

const DEFAULT_VIEWER_ACTIVITY: ClubViewerActivityApi = {
  unreadCount: 0,
  lastSeenAt: null,
  mutedUntil: null,
  isMuted: false,
};

export function formatClubMembersLabel(memberCount: number): string {
  const normalizedMemberCount = Math.max(0, memberCount);
  const memberLabel = normalizedMemberCount === 1 ? 'membro' : 'membros';

  return `${normalizedMemberCount} ${memberLabel}`;
}

export function formatClubPromptsLabel(promptCount: number): string {
  const normalizedPromptCount = Math.max(0, promptCount);
  const promptLabel = normalizedPromptCount === 1 ? 'prompt' : 'prompts';

  return `${normalizedPromptCount} ${promptLabel}`;
}

export function upsertClubListItem(
  currentClubs: ClubListItem[],
  nextClub: ClubListItem,
): ClubListItem[] {
  const hasClub = currentClubs.some((club) => club.id === nextClub.id);

  if (!hasClub) {
    return [nextClub, ...currentClubs];
  }

  return currentClubs.map((club) =>
    club.id === nextClub.id ? nextClub : club,
  );
}

function getClubDescription(description: string | null | undefined): string {
  const trimmedDescription = description?.trim();

  return trimmedDescription || DEFAULT_CLUB_DESCRIPTION;
}

function getClubIconName(iconName: string | null | undefined): string {
  const trimmedIconName = iconName?.trim();

  return trimmedIconName || DEFAULT_CLUB_ICON_NAME;
}

function getMembershipStatusLabel(club: ClubSummaryApi): string | undefined {
  const { viewerMembership } = club;

  if (!viewerMembership.status) {
    return undefined;
  }

  if (viewerMembership.status !== 'active') {
    return MEMBER_STATUS_LABELS[viewerMembership.status];
  }

  if (!viewerMembership.isMember) {
    return undefined;
  }

  return viewerMembership.role
    ? MEMBER_ROLE_LABELS[viewerMembership.role]
    : MEMBER_STATUS_LABELS.active;
}

function getClubListStatusLabel(club: ClubSummaryApi): string | undefined {
  return CLUB_STATUS_LABELS[club.status] ?? getMembershipStatusLabel(club);
}

function getClubListIsActive(club: ClubSummaryApi): boolean {
  return (
    club.status === 'active' &&
    club.viewerMembership.isMember &&
    club.viewerMembership.status === 'active'
  );
}

function getMembershipLabel(club: ClubSummaryApi): string {
  const { viewerMembership } = club;

  if (!viewerMembership.status) {
    return club.visibility === 'private' ? 'Acesso privado' : 'Visitante';
  }

  if (viewerMembership.status !== 'active') {
    return MEMBER_STATUS_LABELS[viewerMembership.status];
  }

  if (!viewerMembership.isMember) {
    return 'Visitante';
  }

  return viewerMembership.role
    ? MEMBER_ROLE_LABELS[viewerMembership.role]
    : MEMBER_STATUS_LABELS.active;
}

export function mapClubViewerActivity(
  activity: ClubSummaryApi['viewerActivity'],
): ClubViewerActivityApi {
  if (!activity) {
    return { ...DEFAULT_VIEWER_ACTIVITY };
  }

  return {
    unreadCount: Math.max(0, activity.unreadCount ?? 0),
    lastSeenAt: activity.lastSeenAt ?? null,
    mutedUntil: activity.mutedUntil ?? null,
    isMuted: Boolean(activity.isMuted),
  };
}

export function mapClubSummaryToListItem(
  club: ClubSummaryApi,
): ClubListItem {
  const viewerActivity = mapClubViewerActivity(club.viewerActivity);

  return {
    id: club.id,
    name: club.name,
    description: getClubDescription(club.description),
    memberCount: club.memberCount,
    membersLabel: formatClubMembersLabel(club.memberCount),
    statusLabel: getClubListStatusLabel(club),
    iconName: getClubIconName(club.iconName),
    isActive: getClubListIsActive(club),
    viewerActivity,
    unreadCount: viewerActivity.unreadCount,
    hasUnreadActivity: viewerActivity.unreadCount > 0,
  };
}

export function mapClubSummaryToDiscoverItem(
  club: ClubSummaryApi,
  source: ClubDiscoverItemSource,
): ClubDiscoverItem {
  return {
    id: club.id,
    name: club.name,
    description: getClubDescription(club.description),
    memberCount: club.memberCount,
    membersLabel: formatClubMembersLabel(club.memberCount),
    badgeLabel: DISCOVERY_BADGE_LABELS[source],
    iconName: getClubIconName(club.iconName),
    // The "popular" discovery source is the one that should receive trending treatment in the card.
    isTrending: source === 'popular',
    isMember: club.viewerMembership.isMember,
    membershipStatus: club.viewerMembership.status,
  };
}

export function getBlockedClubDetailPermissions(): ClubPermissionsApi {
  return { ...BLOCKED_CLUB_DETAIL_PERMISSIONS };
}

export function mapClubDetailsToDetail(club: ClubDetailsApi): ClubDetail {
  const viewerActivity = mapClubViewerActivity(club.viewerActivity);

  return {
    id: club.id,
    slug: club.slug,
    name: club.name,
    description: getClubDescription(club.description),
    descriptionText: club.description ?? '',
    iconName: getClubIconName(club.iconName),
    avatarUrl: club.avatarUrl,
    coverUrl: club.coverUrl,
    visibility: club.visibility,
    visibilityLabel: CLUB_VISIBILITY_LABELS[club.visibility],
    status: club.status,
    statusLabel: CLUB_DETAIL_STATUS_LABELS[club.status],
    memberCount: club.memberCount,
    membersLabel: formatClubMembersLabel(club.memberCount),
    promptCount: club.promptCount,
    promptsLabel: formatClubPromptsLabel(club.promptCount),
    lastActivityAt: club.lastActivityAt,
    rules: club.rules,
    tags: club.tags,
    createdAt: club.createdAt,
    updatedAt: club.updatedAt,
    archivedAt: club.archivedAt,
    deletedAt: club.deletedAt,
    joinPolicy: club.joinPolicy,
    viewerMembership: club.viewerMembership,
    viewerActivity,
    membershipLabel: getMembershipLabel(club),
    permissions: club.permissions,
  };
}

function formatAuditUnknownLabel(value: string): string {
  const spacedValue = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();

  if (!spacedValue) {
    return 'Detalhe';
  }

  return spacedValue.charAt(0).toUpperCase() + spacedValue.slice(1);
}

function formatAuditId(value: string | null): string | null {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  return normalizedValue.length > 8
    ? `${normalizedValue.slice(0, 8)}...`
    : normalizedValue;
}

function formatAuditTimestamp(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const pad = (part: number) => String(part).padStart(2, '0');

  return [
    `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`,
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`,
  ].join(' ');
}

function formatAuditPrimitiveValue(value: string | number | boolean): string {
  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Nao';
  }

  return String(value);
}

function formatAuditArrayValue(value: ClubAuditMetadataApi[]): string | null {
  const visibleValues = value
    .slice(0, MAX_AUDIT_METADATA_ARRAY_ITEMS)
    .map((item) => {
      if (
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean'
      ) {
        return formatAuditPrimitiveValue(item);
      }

      return null;
    })
    .filter((item): item is string => Boolean(item));

  return visibleValues.length > 0 ? visibleValues.join(', ') : null;
}

function getAuditMetadataLabel(key: string, prefix?: string): string {
  const baseLabel = AUDIT_METADATA_LABELS[key] ?? formatAuditUnknownLabel(key);

  return prefix ? `${prefix} ${baseLabel}` : baseLabel;
}

function collectAuditMetadataEntries(
  metadata: ClubAuditMetadataApi,
  prefix?: string,
  entries: ClubAuditMetadataEntry[] = [],
): ClubAuditMetadataEntry[] {
  if (entries.length >= MAX_AUDIT_METADATA_ENTRIES || metadata === null) {
    return entries;
  }

  if (
    typeof metadata === 'string' ||
    typeof metadata === 'number' ||
    typeof metadata === 'boolean'
  ) {
    entries.push({
      label: prefix ?? 'Detalhe',
      value: formatAuditPrimitiveValue(metadata),
    });
    return entries;
  }

  if (Array.isArray(metadata)) {
    const value = formatAuditArrayValue(metadata);

    if (value) {
      entries.push({
        label: prefix ?? 'Lista',
        value,
      });
    }

    return entries;
  }

  Object.entries(metadata).some(([key, value]) => {
    if (entries.length >= MAX_AUDIT_METADATA_ENTRIES) {
      return true;
    }

    if (SENSITIVE_AUDIT_METADATA_KEY_PATTERN.test(key)) {
      return false;
    }

    const label = getAuditMetadataLabel(key, prefix);

    collectAuditMetadataEntries(value, label, entries);

    return false;
  });

  return entries;
}

export function mapClubAuditLogToItem(
  auditLog: ClubAuditLogApi,
): ClubAuditLogItem {
  const entityId = formatAuditId(auditLog.entityId);
  const entityTypeLabel = auditLog.entityType
    ? AUDIT_ENTITY_LABELS[auditLog.entityType] ??
      formatAuditUnknownLabel(auditLog.entityType)
    : null;

  return {
    id: auditLog.id,
    action: auditLog.action,
    actionLabel:
      AUDIT_ACTION_LABELS[auditLog.action] ??
      formatAuditUnknownLabel(auditLog.action),
    actorId: auditLog.actorId,
    actorLabel: auditLog.actorId
      ? `Ator ${formatAuditId(auditLog.actorId)}`
      : 'Sistema',
    targetUserId: auditLog.targetUserId,
    targetLabel: auditLog.targetUserId
      ? `Alvo ${formatAuditId(auditLog.targetUserId)}`
      : null,
    entityType: auditLog.entityType,
    entityId: auditLog.entityId,
    entityLabel:
      entityTypeLabel && entityId
        ? `${entityTypeLabel} ${entityId}`
        : entityTypeLabel,
    createdAt: auditLog.createdAt,
    createdAtLabel: formatAuditTimestamp(auditLog.createdAt),
    metadataEntries: collectAuditMetadataEntries(auditLog.metadata),
  };
}
