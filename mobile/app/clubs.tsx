import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import FeedHeader from '../components/feed/FeedHeader';
import FeedBottomNav from '../components/feed/FeedBottomNav';

import ClubsSegmentedTabs from '../components/clubs/ClubsSegmentedTabs';
import ClubsSearchInput from '../components/clubs/ClubsSearchInput';
import ClubsEmptyState from '../components/clubs/ClubsEmptyState';
import ClubsFab from '../components/clubs/ClubsFab';

import { useTheme } from '../context/ThemeContext';
import {
  DARK_CLUBS_COLORS,
  LIGHT_CLUBS_COLORS,
} from '../constants/clubsTheme';
import { useClubsScreen } from '../hooks/useClubsScreen';
import { FEED_BOTTOM_NAV_ITEMS } from '../data/feedMock';

export default function ClubsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = isDark ? DARK_CLUBS_COLORS : LIGHT_CLUBS_COLORS;

  const {
    activeTab,
    query,
    setQuery,
    handleChangeTab,
  } = useClubsScreen();

  function handleBottomNavSelect(key: 'play' | 'search' | 'clubs' | 'profile') {
    switch (key) {
      case 'play':
        router.replace('/feed');
        return;
      case 'search':
        router.replace('/search');
        return;
      case 'clubs':
        return;
      case 'profile':
        router.replace('/profile');
        return;
      default:
        return;
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.green }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.green}
      />

      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <FeedHeader
          title="Truth or Dare"
          initials=""
          headerGreen={colors.green}
          white={colors.white}
          surfaceContainer={colors.surface}
          borderBottomColor={
            isDark ? 'rgba(255,255,255,0.10)' : 'rgba(207,247,238,0.20)'
          }
          avatarBorderColor={
            isDark ? 'rgba(255,255,255,0.30)' : 'rgba(207,247,238,0.30)'
          }
          avatarBackgroundColor={isDark ? '#121212' : colors.surface}
          onPressNotifications={() => {
            router.push('/notifications');
          }}
        />

        <ClubsSegmentedTabs
          activeTab={activeTab}
          onChangeTab={handleChangeTab}
          colors={colors}
        />

        <View style={styles.content}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerSection}>
              <Text style={[styles.title, { color: colors.text }]}>
                Clubes
              </Text>
              <Text style={[styles.subtitle, { color: colors.subText }]}>
                Gerencie e descubra clubes quando o backend estiver disponível.
              </Text>
            </View>

            {activeTab === 'discover' ? (
              <ClubsSearchInput
                value={query}
                onChangeText={setQuery}
                colors={colors}
              />
            ) : null}

            <ClubsEmptyState
              colors={colors}
              title={
                activeTab === 'my-clubs'
                  ? 'Nenhum clube disponível'
                  : 'Busca de clubes indisponível'
              }
              description={
                activeTab === 'my-clubs'
                  ? 'Seus clubes aparecerão aqui quando estiverem integrados com o backend.'
                  : 'A busca de clubes será habilitada quando o backend estiver conectado.'
              }
              iconName={activeTab === 'my-clubs' ? 'groups' : 'search'}
            />
          </ScrollView>
        </View>

        <ClubsFab
          colors={colors}
          onPress={() => {
            router.push('/create-group');
          }}
        />

        <FeedBottomNav
          items={FEED_BOTTOM_NAV_ITEMS}
          activeKey="clubs"
          onSelect={handleBottomNavSelect}
          backgroundColor={colors.green}
          borderTopColor={
            isDark ? 'rgba(255,255,255,0.10)' : 'rgba(207,247,238,0.10)'
          }
          activeBackgroundColor={colors.red}
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
  content: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
    gap: 20,
  },
  headerSection: {
    gap: 6,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -1.1,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});