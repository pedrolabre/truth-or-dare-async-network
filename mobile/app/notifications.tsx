import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

import AccountScreenHeader from '../components/account/AccountScreenHeader';
import FeedBottomNav from '../components/feed/FeedBottomNav';
import NotificationsIntro from '../components/notifications/NotificationsIntro';
import NotificationsComingSoonCard from '../components/notifications/NotificationsComingSoonCard';
import { FEED_BOTTOM_NAV_ITEMS } from '../data/feedMock';
import type { BottomNavKey } from '../types/feed';

const LIGHT = {
  bg: '#f5fbf6',
  card: '#eaefea',
  cardSoft: '#eff5f0',
  text: '#171d1a',
  sub: '#3d4944',
  muted: '#6d7a74',
  outline: '#bccac2',
  green: '#5A8363',
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
  red: '#E11D2E',
  white: '#f9f9f9',
};

export default function NotificationsScreen() {
  const { isDark } = useTheme();
  const c = isDark ? DARK : LIGHT;
  const router = useRouter();

  const notifications: unknown[] = [];
  const allRead = notifications.length === 0;

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

  return (
    <View style={[styles.root, { backgroundColor: c.green }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={c.green}
      />

      <View style={[styles.screen, { backgroundColor: c.bg }]}>
        <AccountScreenHeader
          title="Notificações"
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
        >
          <NotificationsIntro
            allRead={allRead}
            titleColor={c.text}
            actionColor={c.green}
            disabledColor={c.muted}
            onPressMarkAllRead={() => {
              // backend futuro:
              // marcar todas como lidas
            }}
          />

          <NotificationsComingSoonCard
            backgroundColor={c.cardSoft}
            borderColor={c.outline}
            iconBackgroundColor={c.card}
            iconColor={c.muted}
            titleColor={c.text}
            textColor={c.sub}
          />
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
    paddingBottom: 28,
  },
});