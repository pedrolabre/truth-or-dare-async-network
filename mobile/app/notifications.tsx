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
import FeedBottomNav from '../components/feed/FeedBottomNav';
import NotificationActivityCard from '../components/notifications/NotificationActivityCard';
import NotificationsEmptyState from '../components/notifications/NotificationsEmptyState';
import NotificationsErrorState from '../components/notifications/NotificationsErrorState';
import NotificationsGroupHeader from '../components/notifications/NotificationsGroupHeader';
import NotificationsIntro from '../components/notifications/NotificationsIntro';
import NotificationsSkeleton from '../components/notifications/NotificationsSkeleton';
import { FEED_BOTTOM_NAV_ITEMS } from '../data/feedMock';
import { useNotificationsScreen } from '../hooks/useNotificationsScreen';
import type { BottomNavKey } from '../types/feed';
import type { NotificationItem, NotificationType } from '../types/notifications';

const LIGHT = {
  bg: '#f5fbf6',
  card: '#ffffff',
  cardSoft: '#eff5f0',
  text: '#171d1a',
  sub: '#3d4944',
  muted: '#6d7a74',
  outline: '#bccac2',
  green: '#5A8363',
  greenSoft: '#e7f3ea',
  blue: '#2563EB',
  blueSoft: '#eaf1ff',
  amber: '#9A6700',
  amberSoft: '#fff3c4',
  red: '#D70015',
  white: '#ffffff',
};

const DARK = {
  bg: '#121212',
  card: '#232323',
  cardSoft: '#1b1d1b',
  text: '#f5fbf6',
  sub: '#bccac2',
  muted: '#8f9993',
  outline: '#444746',
  green: '#5A8363',
  greenSoft: '#203328',
  blue: '#60A5FA',
  blueSoft: '#17263d',
  amber: '#F4C430',
  amberSoft: '#332a14',
  red: '#E11D2E',
  white: '#f9f9f9',
};

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

export default function NotificationsScreen() {
  const { isDark } = useTheme();
  const c = isDark ? DARK : LIGHT;
  const router = useRouter();
  const notifications = useNotificationsScreen();

  function handleBottomNavSelect(key: BottomNavKey) {
    switch (key) {
      case 'play':
        router.replace('/feed');
        return;
      case 'search':
        router.replace('/search');
        return;
      case 'clubs':
        router.replace('/clubs');
        return;
      case 'profile':
        router.replace('/profile');
        return;
      default:
        return;
    }
  }

  async function handlePressNotification(notification: NotificationItem) {
    const target = await notifications.handlePressNotification(notification);

    if (target?.type === 'club') {
      router.push(`/clubs/${encodeURIComponent(target.clubId)}` as Href);
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
          message={notifications.errorMessage ?? 'Tente novamente em instantes.'}
          backgroundColor={c.card}
          borderColor={c.outline}
          iconBackgroundColor={c.cardSoft}
          iconColor={c.red}
          titleColor={c.text}
          textColor={c.sub}
          actionBackgroundColor={c.green}
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
                    soft: c.greenSoft,
                  },
                  feed: {
                    accent: c.blue,
                    soft: c.blueSoft,
                  },
                  account: {
                    accent: c.amber,
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
                    iconBackgroundColor={unread ? tone.accent : tone.soft}
                    backgroundColor={unread ? tone.soft : c.card}
                    borderColor={unread ? tone.accent : c.outline}
                    titleColor={c.text}
                    textColor={c.sub}
                    timeColor={c.muted}
                    unread={unread}
                    unreadAccentColor={c.red}
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
    <View style={[styles.root, { backgroundColor: c.green }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={c.green}
      />

      <View style={[styles.screen, { backgroundColor: c.bg }]}>
        <AccountScreenHeader
          title="Notificacoes"
          headerGreen={c.green}
          titleColor={c.white}
          borderBottomColor="rgba(207,247,238,0.20)"
          leftIcon="arrow-back"
          onPressLeft={() => router.back()}
          rightIcon="notifications"
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
            actionColor={c.green}
            disabledColor={c.muted}
            onPressMarkAllRead={() => {
              void notifications.handleMarkAllRead();
            }}
          />

          {renderContent()}
        </ScrollView>

        <FeedBottomNav
          items={FEED_BOTTOM_NAV_ITEMS}
          activeKey="profile"
          onSelect={handleBottomNavSelect}
          backgroundColor={c.green}
          borderTopColor="rgba(207,247,238,0.10)"
          activeBackgroundColor={c.red}
          activeIconColor="#ffffff"
          activeTextColor="#ffffff"
          inactiveIconColor="rgba(249,249,249,0.72)"
          inactiveTextColor="rgba(249,249,249,0.72)"
        />
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
    paddingBottom: 118,
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
