import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
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
import ClubDetailStateCard from '../../components/clubs/ClubDetailStateCard';
import ClubDetailTabs from '../../components/clubs/ClubDetailTabs';
import ClubFeedPanel from '../../components/clubs/ClubFeedPanel';
import ClubHeaderCard from '../../components/clubs/ClubHeaderCard';
import ClubInvitesModal from '../../components/clubs/ClubInvitesModal';
import ClubPromptComposerModal from '../../components/clubs/ClubPromptComposerModal';
import ClubRankingPanel from '../../components/clubs/ClubRankingPanel';
import ClubSettingsModal from '../../components/clubs/ClubSettingsModal';
import {
  DARK_CLUBS_COLORS,
  LIGHT_CLUBS_COLORS,
  type ClubsThemeColors,
} from '../../constants/clubsTheme';
import { useTheme } from '../../context/ThemeContext';
import { useClubDetailsScreen } from '../../hooks/useClubDetailsScreen';
import { useClubFeed } from '../../hooks/useClubFeed';
import type { ClubDetail, ClubDetailTabKey } from '../../types/clubs';

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
  const [activeTab, setActiveTab] =
    React.useState<ClubDetailTabKey>('feed');
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
  const headerTitle = club?.name ?? 'Clube';

  React.useEffect(() => {
    setActiveTab('feed');
  }, [clubId]);

  function renderActiveTabPanel(readyClub: ClubDetail) {
    switch (activeTab) {
      case 'about':
        return <ClubAboutPanel club={readyClub} colors={colors} />;
      case 'ranking':
        return <ClubRankingPanel colors={colors} />;
      case 'members':
        return (
          <DeferredClubPanel
            colors={colors}
            iconName="groups"
            testID="club-members-placeholder"
            title="Membros em preparacao"
            description={`A lista completa de membros ainda nao esta conectada nesta tela. O contador atual vem do detalhe do clube: ${readyClub.membersLabel}.`}
          />
        );
      case 'feed':
      default:
        return <ClubFeedPanel colors={colors} feed={clubFeed} />;
    }
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

        <ClubSettingsModal
          visible={settingsVisible}
          club={club}
          canEdit={Boolean(permissions?.canEditClub)}
          colors={colors}
          onClose={() => setSettingsVisible(false)}
          onUpdated={handleClubUpdated}
        />
      </View>
    </View>
  );
}

type DeferredClubPanelProps = {
  colors: ClubsThemeColors;
  iconName: keyof typeof MaterialIcons.glyphMap;
  testID: string;
  title: string;
  description: string;
};

function DeferredClubPanel({
  colors,
  iconName,
  testID,
  title,
  description,
}: DeferredClubPanelProps) {
  return (
    <View
      testID={testID}
      style={[
        styles.deferredPanel,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={[styles.deferredIconWrap, { backgroundColor: colors.surfaceSoft }]}>
        <MaterialIcons name={iconName} size={28} color={colors.muted} />
      </View>

      <Text style={[styles.deferredTitle, { color: colors.text }]}>
        {title}
      </Text>

      <Text style={[styles.deferredDescription, { color: colors.subText }]}>
        {description}
      </Text>
    </View>
  );
}

type FeedbackBannerProps = {
  colors: ClubsThemeColors;
  message: string;
  tone: 'danger' | 'success';
};

function FeedbackBanner({ colors, message, tone }: FeedbackBannerProps) {
  const isDanger = tone === 'danger';

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
          { color: isDanger ? colors.red : colors.green },
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
  deferredPanel: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 12,
  },
  deferredIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deferredTitle: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  deferredDescription: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    maxWidth: 292,
  },
  pressed: {
    opacity: 0.78,
  },
});
