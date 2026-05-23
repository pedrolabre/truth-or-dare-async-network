import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ClubActionBar from '../../components/clubs/ClubActionBar';
import ClubAboutPanel from '../../components/clubs/ClubAboutPanel';
import ClubDareProofModal from '../../components/clubs/ClubDareProofModal';
import ClubDetailStateCard from '../../components/clubs/ClubDetailStateCard';
import ClubDetailTabs from '../../components/clubs/ClubDetailTabs';
import ClubFeedPanel from '../../components/clubs/ClubFeedPanel';
import ClubHeaderCard from '../../components/clubs/ClubHeaderCard';
import ClubInvitesModal from '../../components/clubs/ClubInvitesModal';
import ClubMembersPanel from '../../components/clubs/ClubMembersPanel';
import ClubPromptComposerModal from '../../components/clubs/ClubPromptComposerModal';
import ClubRankingPanel from '../../components/clubs/ClubRankingPanel';
import ClubReportModal from '../../components/clubs/ClubReportModal';
import ClubSettingsModal from '../../components/clubs/ClubSettingsModal';
import ClubTruthResponseModal from '../../components/clubs/ClubTruthResponseModal';
import {
  DARK_CLUBS_COLORS,
  LIGHT_CLUBS_COLORS,
  type ClubsThemeColors,
} from '../../constants/clubsTheme';
import { useTheme } from '../../context/ThemeContext';
import { useClubDetailsScreen } from '../../hooks/useClubDetailsScreen';
import { useClubFeed } from '../../hooks/useClubFeed';
import { useClubMembers } from '../../hooks/useClubMembers';
import { useClubModeration } from '../../hooks/useClubModeration';
import type { ClubDetail, ClubDetailTabKey } from '../../types/clubs';
import type { ClubFeedItemApi, ClubMemberApi } from '../../types/clubsApi';

type ClubDetailRouteParams = {
  id?: string | string[];
};

export default function ClubDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<ClubDetailRouteParams>();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = isDark ? DARK_CLUBS_COLORS : LIGHT_CLUBS_COLORS;
  const [invitesVisible, setInvitesVisible] = React.useState(false);
  const [settingsVisible, setSettingsVisible] = React.useState(false);
  const [promptComposerVisible, setPromptComposerVisible] =
    React.useState(false);
  const [truthPrompt, setTruthPrompt] = React.useState<ClubFeedItemApi | null>(
    null,
  );
  const [darePrompt, setDarePrompt] = React.useState<ClubFeedItemApi | null>(
    null,
  );
  const [activeTab, setActiveTab] =
    React.useState<ClubDetailTabKey>('feed');
  const moderation = useClubModeration();
  const {
    club,
    clubId,
    permissions,
    contentState,
    errorMessage,
    isRefreshing,
    pendingAction,
    actionErrorMessage,
    actionSuccessMessage,
    isMuted,
    canRetry,
    clearActionFeedback,
    handleClubUpdated,
    handleJoinClub,
    handleLeaveClub,
    handleToggleMute,
    handleCreatePrompt,
    handleRefresh,
    handleRetry,
  } = useClubDetailsScreen({
    clubId: params.id,
  });
  const clubFeed = useClubFeed({
    clubId,
    isActive: contentState === 'ready' && activeTab === 'feed',
    canViewFeed: Boolean(permissions?.canViewFeed),
  });
  const clubMembers = useClubMembers({
    clubId,
    isActive: contentState === 'ready' && activeTab === 'members',
  });
  const headerTitle = club?.name ?? 'Clube';

  React.useEffect(() => {
    setActiveTab('feed');
  }, [clubId]);

  async function handleBlockMember(member: ClubMemberApi) {
    if (!clubId) {
      return;
    }

    const updatedMember = await moderation.blockMember(clubId, member.userId);

    if (updatedMember) {
      clubMembers.replaceMember(updatedMember);
      void handleRefresh();
    }
  }

  async function handleSuspendMemberPosting(member: ClubMemberApi) {
    if (!clubId) {
      return;
    }

    const updatedMember = await moderation.suspendMemberPosting(
      clubId,
      member.userId,
    );

    if (updatedMember) {
      clubMembers.replaceMember(updatedMember);
    }
  }

  function confirmBlockMember(member: ClubMemberApi) {
    Alert.alert(
      'Bloquear membro',
      `Bloquear ${member.name} remove o acesso ativo ao clube.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: () => {
            void handleBlockMember(member);
          },
        },
      ],
    );
  }

  function confirmSuspendMemberPosting(member: ClubMemberApi) {
    Alert.alert(
      'Suspender postagem',
      `Suspender ${member.name} por 24 horas impede prompts, respostas e comentarios.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Suspender',
          style: 'destructive',
          onPress: () => {
            void handleSuspendMemberPosting(member);
          },
        },
      ],
    );
  }

  function renderActiveTabPanel(readyClub: ClubDetail) {
    switch (activeTab) {
      case 'about':
        return <ClubAboutPanel club={readyClub} colors={colors} />;
      case 'ranking':
        return <ClubRankingPanel colors={colors} />;
      case 'members':
        return (
          <ClubMembersPanel
            colors={colors}
            members={clubMembers}
            canManageMembers={Boolean(readyClub.permissions.canManageMembers)}
            viewerRole={readyClub.viewerMembership.role}
            restrictingUserId={moderation.restrictingUserId}
            onBlockMember={confirmBlockMember}
            onSuspendMemberPosting={confirmSuspendMemberPosting}
          />
        );
      case 'feed':
      default:
        return (
          <ClubFeedPanel
            colors={colors}
            feed={clubFeed}
            onAnswerTruth={(item) => {
              clubFeed.clearResponseError();
              setTruthPrompt(item);
            }}
            onOpenComments={(item) => {
              router.push({
                pathname: '/feed-comments',
                params: {
                  itemId: item.id,
                  itemType: 'club',
                  clubId: readyClub.id,
                  title: item.content,
                  clubName: readyClub.name,
                  badge: item.type === 'truth' ? 'Verdade' : 'Desafio',
                  quote: item.content,
                  commentsCount: String(item.commentsCount),
                  likesCount: String(item.likesCount),
                },
              });
            }}
            onSubmitDareProof={(item) => {
              clubFeed.clearResponseError();
              setDarePrompt(item);
            }}
            onReportPrompt={(item) => {
              moderation.openReport({
                type: 'prompt',
                clubId: readyClub.id,
                promptId: item.id,
                title: item.content,
              });
            }}
            onReportResponse={(item, response) => {
              moderation.openReport({
                type: 'response',
                clubId: readyClub.id,
                promptId: item.id,
                responseId: response.id,
                title: response.text?.trim() || `Resposta de ${response.userName}`,
              });
            }}
          />
        );
    }
  }

  function getAccessNotice(readyClub: ClubDetail) {
    const status = readyClub.viewerMembership.status;

    if (status === 'blocked') {
      return 'Voce foi bloqueado neste clube. Feed, postagem e interacoes ficam indisponiveis.';
    }

    if (status === 'removed') {
      return 'Sua participacao foi removida deste clube. As acoes internas ficam indisponiveis.';
    }

    if (status === 'requested') {
      return 'Sua solicitacao de entrada esta pendente. Algumas areas continuam bloqueadas ate aprovacao.';
    }

    if (!readyClub.permissions.canPostPrompt && readyClub.viewerMembership.isMember) {
      return 'Voce nao pode postar agora. Se houver suspensao temporaria, tente novamente quando ela terminar.';
    }

    if (!readyClub.permissions.canViewFeed) {
      return 'Voce nao tem permissao para ver o feed deste clube.';
    }

    return null;
  }

  function renderDetailContent() {
    if (contentState !== 'ready' || !club) {
      return (
        <ClubDetailStateCard
          colors={colors}
          state={contentState === 'ready' ? 'error' : contentState}
          errorMessage={errorMessage}
          onRetry={
            canRetry
              ? () => {
                  void handleRetry();
                }
              : undefined
          }
        />
      );
    }

    return (
      <View testID="club-detail-summary-card" style={styles.readyStack}>
        <ClubHeaderCard club={club} colors={colors} />

        {getAccessNotice(club) ? (
          <FeedbackBanner
            colors={colors}
            message={getAccessNotice(club) ?? ''}
            tone="warning"
          />
        ) : null}

        {errorMessage ? (
          <FeedbackBanner colors={colors} message={errorMessage} tone="danger" />
        ) : null}

        {actionErrorMessage ? (
          <FeedbackBanner
            colors={colors}
            message={actionErrorMessage}
            tone="danger"
          />
        ) : null}

        {actionSuccessMessage ? (
          <FeedbackBanner
            colors={colors}
            message={actionSuccessMessage}
            tone="success"
          />
        ) : null}

        {moderation.restrictionErrorMessage ? (
          <FeedbackBanner
            colors={colors}
            message={moderation.restrictionErrorMessage}
            tone="danger"
          />
        ) : null}

        {moderation.restrictionSuccessMessage ? (
          <FeedbackBanner
            colors={colors}
            message={moderation.restrictionSuccessMessage}
            tone="success"
          />
        ) : null}

        <ClubActionBar
          club={club}
          colors={colors}
          pendingAction={pendingAction}
          isMuted={isMuted}
          onJoin={() => {
            void handleJoinClub();
          }}
          onLeave={() => {
            void handleLeaveClub();
          }}
          onInvite={() => {
            clearActionFeedback();
            setInvitesVisible(true);
          }}
          onPostPrompt={() => {
            clearActionFeedback();
            setPromptComposerVisible(true);
          }}
          onToggleMute={() => {
            void handleToggleMute();
          }}
          onOpenSettings={() => {
            clearActionFeedback();
            setSettingsVisible(true);
          }}
          onReportClub={() => {
            if (!club) {
              return;
            }

            clearActionFeedback();
            moderation.openReport({
              type: 'club',
              clubId: club.id,
              title: club.name,
            });
          }}
        />

        <ClubDetailTabs
          activeTab={activeTab}
          colors={colors}
          onChangeTab={setActiveTab}
        />

        {renderActiveTabPanel(club)}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.green }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.green}
      />

      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 12),
              backgroundColor: colors.green,
              borderBottomColor: colors.cardBorder,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={10}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name="arrow-back" size={23} color={colors.white} />
          </Pressable>

          <Text
            numberOfLines={1}
            style={[styles.headerTitle, { color: colors.white }]}
          >
            {headerTitle}
          </Text>

          <View style={styles.iconButton} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            contentState === 'ready' ? styles.readyContent : styles.stateContent,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                void handleRefresh();
              }}
              tintColor={colors.green}
              colors={[colors.green]}
              progressBackgroundColor={colors.surface}
            />
          }
        >
          {renderDetailContent()}
        </ScrollView>

        <ClubInvitesModal
          visible={invitesVisible}
          clubId={clubId}
          canInvite={Boolean(permissions?.canInviteMembers)}
          colors={colors}
          onClose={() => setInvitesVisible(false)}
        />

        <ClubPromptComposerModal
          visible={promptComposerVisible}
          canPostPrompt={Boolean(permissions?.canPostPrompt)}
          colors={colors}
          onClose={() => setPromptComposerVisible(false)}
          onSubmitPrompt={handleCreatePrompt}
        />

        <ClubTruthResponseModal
          visible={Boolean(truthPrompt)}
          prompt={truthPrompt}
          colors={colors}
          isSubmitting={clubFeed.responseSubmittingPromptId === truthPrompt?.id}
          onClose={() => setTruthPrompt(null)}
          onSubmit={async (text) => {
            if (!truthPrompt) {
              return;
            }

            await clubFeed.submitPromptResponse(truthPrompt.id, {
              text,
              mediaUrl: null,
              mediaType: null,
              dareProofId: null,
            });
            setTruthPrompt(null);
          }}
        />

        <ClubDareProofModal
          visible={Boolean(darePrompt)}
          prompt={darePrompt}
          colors={colors}
          submitResponse={async (payload) => {
            if (!darePrompt) {
              return null;
            }

            return clubFeed.submitPromptResponse(darePrompt.id, payload);
          }}
          onClose={() => setDarePrompt(null)}
          onSubmitted={() => setDarePrompt(null)}
        />

        <ClubSettingsModal
          visible={settingsVisible}
          club={club}
          canEdit={Boolean(permissions?.canEditClub)}
          colors={colors}
          onClose={() => setSettingsVisible(false)}
          onUpdated={handleClubUpdated}
        />

        <ClubReportModal
          visible={Boolean(moderation.activeReportTarget)}
          target={moderation.activeReportTarget}
          colors={colors}
          isSubmitting={moderation.isSubmittingReport}
          errorMessage={moderation.reportErrorMessage}
          successMessage={moderation.reportSuccessMessage}
          onClose={moderation.closeReport}
          onSubmit={moderation.submitReport}
          onFinish={moderation.finishReport}
        />
      </View>
    </View>
  );
}

type FeedbackBannerProps = {
  colors: ClubsThemeColors;
  message: string;
  tone: 'danger' | 'success' | 'warning';
};

function FeedbackBanner({ colors, message, tone }: FeedbackBannerProps) {
  const isDanger = tone === 'danger';
  const isWarning = tone === 'warning';

  return (
    <View
      style={[
        styles.feedbackBanner,
        {
          backgroundColor: isDanger ? colors.redSoft : colors.greenSoft,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <Text
        style={[
          styles.feedbackText,
          { color: isDanger ? colors.red : isWarning ? colors.text : colors.green },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  header: {
    minHeight: 88,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 28,
  },
  stateContent: {
    justifyContent: 'center',
  },
  readyContent: {
    justifyContent: 'flex-start',
  },
  readyStack: {
    gap: 16,
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
  pressed: {
    opacity: 0.78,
  },
});
