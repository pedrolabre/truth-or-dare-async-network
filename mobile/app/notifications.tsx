import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { Href, useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

import AccountScreenHeader from '../components/account/AccountScreenHeader';
import NotificationActivityCard from '../components/notifications/NotificationActivityCard';
import NotificationsEmptyState from '../components/notifications/NotificationsEmptyState';
import NotificationsErrorState from '../components/notifications/NotificationsErrorState';
import NotificationsGroupHeader from '../components/notifications/NotificationsGroupHeader';
import NotificationsIntro from '../components/notifications/NotificationsIntro';
import NotificationsSkeleton from '../components/notifications/NotificationsSkeleton';
import {
  DARK_CLUBS_COLORS,
  LIGHT_CLUBS_COLORS,
} from '../constants/clubsTheme';
import { useNotificationsUnreadCount } from '../hooks/useNotificationsUnreadCount';
import { useNotificationsScreen } from '../hooks/useNotificationsScreen';
import type { NotificationItem, NotificationType } from '../types/notifications';

type NotificationToneName = 'club' | 'feed' | 'account';

type NotificationPresentation = {
  icon: keyof typeof MaterialIcons.glyphMap;
  tone: NotificationToneName;
};

const NOTIFICATION_PRESENTATION: Record<
  NotificationType,
  NotificationPresentation
> = {
  club_created: { icon: 'groups', tone: 'club' },
  club_invite_received: { icon: 'person-add', tone: 'club' },
  club_invite_accepted: { icon: 'how-to-reg', tone: 'club' },
  club_join_request_received: { icon: 'person-add-alt', tone: 'club' },
  club_join_request_approved: { icon: 'check-circle', tone: 'club' },
  club_join_request_rejected: { icon: 'block', tone: 'club' },
  club_new_prompt: { icon: 'auto-awesome', tone: 'club' },
  club_prompt_response: { icon: 'forum', tone: 'club' },
  club_prompt_comment: { icon: 'chat', tone: 'club' },
  club_mention: { icon: 'alternate-email', tone: 'club' },
  club_member_promoted: { icon: 'verified', tone: 'club' },
  feed_truth_received: { icon: 'help-outline', tone: 'feed' },
  feed_dare_received: { icon: 'flash-on', tone: 'feed' },
  feed_truth_comment: { icon: 'mode-comment', tone: 'feed' },
  feed_like: { icon: 'favorite', tone: 'feed' },
  feed_dare_proof_submitted: { icon: 'assignment-turned-in', tone: 'feed' },
  account_password_reset_completed: { icon: 'verified-user', tone: 'account' },
};

function formatNotificationTime(createdAt: string): string {
  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return '';
  }

  const diffMs = Date.now() - createdDate.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return 'agora';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays}d`;
  }

  return createdDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

function getNotificationPresentation(type: NotificationType) {
  return (
    NOTIFICATION_PRESENTATION[type] ?? {
      icon: 'notifications',
      tone: 'account',
    }
  );
}

function getDefinedRouteParams(params: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  ) as Record<string, string>;
}

export default function NotificationsScreen() {
  const { isDark } = useTheme();
  const appColors = isDark ? DARK_CLUBS_COLORS : LIGHT_CLUBS_COLORS;
  const c = {
    bg: appColors.background,
    card: appColors.surface,
    cardSoft: appColors.surfaceSoft,
    text: appColors.text,
    sub: appColors.subText,
    muted: appColors.muted,
    outline: appColors.cardBorder,
    header: appColors.green,
    green: appColors.green,
    greenSolid: appColors.green,
    greenSoft: appColors.greenSoft,
    blue: appColors.red,
    blueSolid: appColors.red,
    blueSoft: appColors.redSoft,
    amber: appColors.green,
    amberSolid: appColors.green,
    amberSoft: appColors.greenSoft,
    red: appColors.red,
    redAccent: appColors.red,
    white: appColors.white,
  };
  const router = useRouter();
  const notificationsUnreadCount = useNotificationsUnreadCount();
  const notifications = useNotificationsScreen({
    onNotificationRead: notificationsUnreadCount.decrementUnreadCount,
    onAllNotificationsRead: notificationsUnreadCount.clearUnreadCount,
  });
  const visibleNotificationsUnreadCount = notificationsUnreadCount.errorMessage
    ? null
    : notificationsUnreadCount.unreadCount;

  async function handlePressNotification(notification: NotificationItem) {
    const target = await notifications.handlePressNotification(notification);

    switch (target?.type) {
      case 'club':
        router.push(`/clubs/${encodeURIComponent(target.clubId)}` as Href);
        return;
      case 'feed':
        router.push('/feed');
        return;
      case 'comments':
        router.push({
          pathname: '/feed-comments',
          params: getDefinedRouteParams({
            itemId: target.itemId,
            itemType: target.itemType,
            clubId: target.clubId,
            title: target.title,
            clubName: target.clubName,
            badge: target.badge,
            quote: target.quote,
            commentsCount: target.commentsCount,
            likesCount: target.likesCount,
            status: target.status,
          }),
        } as Href);
        return;
      case 'dare':
        router.push({
          pathname: '/action-screen',
          params: getDefinedRouteParams({
            dareId: target.dareId,
            title: target.title,
            challenger: target.challenger,
            status: target.status,
            attemptsUsed: target.attemptsUsed,
            maxAttempts: target.maxAttempts,
            expiresAt: target.expiresAt,
            expiresIn: target.expiresIn,
          }),
        } as Href);
        return;
      case 'proof':
        router.push({
          pathname: '/proof-detail',
          params: getDefinedRouteParams({
            proofId: target.proofId,
            dareId: target.dareId,
            title: target.title,
            challenger: target.challenger,
            mediaType: target.mediaType,
            localUri: target.localUri,
            fileName: target.fileName,
            durationSeconds: target.durationSeconds,
            text: target.text,
            source: target.source,
          }),
        } as Href);
        return;
      case 'profile':
        router.push('/profile');
        return;
      case 'settings':
        router.push('/settings');
        return;
      case 'unsupported':
      default:
        return;
    }
  }

  function renderContent() {
    if (notifications.contentState === 'loading') {
      return (
        <NotificationsSkeleton
          backgroundColor={c.card}
          borderColor={c.outline}
          softColor={c.cardSoft}
        />
      );
    }

    if (notifications.contentState === 'error') {
      return (
        <NotificationsErrorState
          message={
            notifications.errorMessage ??
            'Confira sua conexao e tente novamente.'
          }
          backgroundColor={c.card}
          borderColor={c.outline}
          iconBackgroundColor={c.cardSoft}
          iconColor={c.redAccent}
          titleColor={c.text}
          textColor={c.sub}
          actionBackgroundColor={c.header}
          actionTextColor={c.white}
          onRetry={() => {
            void notifications.handleRetry();
          }}
        />
      );
    }

    if (notifications.contentState === 'empty') {
      return (
        <NotificationsEmptyState
          backgroundColor={c.card}
          borderColor={c.outline}
          iconBackgroundColor={c.cardSoft}
          iconColor={c.green}
          titleColor={c.text}
          textColor={c.sub}
        />
      );
    }

    return (
      <View style={styles.cardsList}>
        {notifications.groupedItems.map((group) => (
          <View key={group.id} style={styles.notificationGroup}>
            <NotificationsGroupHeader
              title={group.title}
              count={group.items.length}
              titleColor={c.muted}
              countColor={c.text}
              countBackgroundColor={c.cardSoft}
            />

            <View style={styles.groupCards}>
              {group.items.map((notification) => {
                const unread = notification.readAt === null;
                const presentation = getNotificationPresentation(
                  notification.type,
                );
                const tone = {
                  club: {
                    accent: c.green,
                    solid: c.greenSolid,
                    soft: c.greenSoft,
                  },
                  feed: {
                    accent: c.blue,
                    solid: c.blueSolid,
                    soft: c.blueSoft,
                  },
                  account: {
                    accent: c.amber,
                    solid: c.amberSolid,
                    soft: c.amberSoft,
                  },
                }[presentation.tone];

                return (
                  <NotificationActivityCard
                    key={notification.id}
                    title={notification.title}
                    description={notification.body}
                    timeLabel={formatNotificationTime(notification.createdAt)}
                    icon={presentation.icon}
                    iconColor={unread ? c.white : tone.accent}
                    iconBackgroundColor={unread ? tone.solid : tone.soft}
                    backgroundColor={unread ? tone.soft : c.card}
                    borderColor={unread ? tone.accent : c.outline}
                    titleColor={c.text}
                    textColor={c.sub}
                    timeColor={c.muted}
                    unread={unread}
                    unreadAccentColor={c.redAccent}
                    onPress={() => {
                      void handlePressNotification(notification);
                    }}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: c.header }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={c.header}
      />

      <View style={[styles.screen, { backgroundColor: c.bg }]}>
        <AccountScreenHeader
          title="Notificacoes"
          headerGreen={c.header}
          titleColor={c.white}
          borderBottomColor="rgba(207,247,238,0.20)"
          leftIcon="arrow-back"
          onPressLeft={() => router.back()}
          rightIcon="notifications"
          rightBadgeCount={visibleNotificationsUnreadCount}
          rightBadgeBackgroundColor={c.red}
          rightBadgeTextColor="#ffffff"
          rightBadgeBorderColor={c.header}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={notifications.isRefreshing}
              onRefresh={() => {
                void notifications.handleRefresh();
              }}
              tintColor={c.green}
              colors={[c.green]}
              progressBackgroundColor={c.card}
            />
          }
        >
          <NotificationsIntro
            allRead={notifications.allRead}
            titleColor={c.text}
            subtitleColor={c.sub}
            actionColor={c.green}
            disabledColor={c.muted}
            onPressMarkAllRead={() => {
              void notifications.handleMarkAllRead();
            }}
          />

          {renderContent()}
        </ScrollView>

      </View>
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 18,
    paddingBottom: 32,
  },
  cardsList: {
    gap: 20,
  },
  notificationGroup: {
    gap: 10,
  },
  groupCards: {
    gap: 12,
  },
});
