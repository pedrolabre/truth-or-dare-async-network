import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import AccountScreenHeader from '../components/account/AccountScreenHeader';
import FeedBottomNav from '../components/feed/FeedBottomNav';
import ProfileIdentityCard from '../components/profile/ProfileIdentityCard';
import ProfileStatsGrid from '../components/profile/ProfileStatsGrid';
import ProfileAchievements from '../components/profile/ProfileAchievements';
import ProfileClubCard from '../components/profile/ProfileClubCard';
import ProfileModals from '../components/profile/ProfileModals';
import { FEED_BOTTOM_NAV_ITEMS } from '../data/feedMock';
import { useProfileScreen } from '../hooks/useProfileScreen';
import { useTheme } from '../context/ThemeContext';

const LIGHT = {
  bg: '#f5fbf6',
  surface: '#eaefea',
  text: '#171d1a',
  sub: '#3d4944',
  outline: '#bccac2',
  green: '#5A8363',
  red: '#D70015',
  white: '#ffffff',
};

const DARK = {
  bg: '#121212',
  surface: '#232323',
  text: '#f5fbf6',
  sub: '#bccac2',
  outline: '#444746',
  green: '#5A8363',
  red: '#E11D2E',
  white: '#f9f9f9',
};

export default function ProfileScreen() {
  const { isDark } = useTheme();
  const c = isDark ? DARK : LIGHT;
  const router = useRouter();
  const profile = useProfileScreen();

  function handleBottomNavSelect(key: 'play' | 'search' | 'clubs' | 'profile') {
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
      default:
        return;
    }
  }

   const displayName =
    profile.displayName?.trim() ||
    profile.profile?.name?.trim() ||
    'Seu nome';

  const username =
    profile.username?.trim().replace(/^@/, '') || profile.profile?.email || '—';

  const bio =
  profile.isLoading
    ? 'Carregando perfil...'
    : profile.bio?.trim() || 'Sem bio ainda';

  const truthsCreatedCount = profile.profile?.createdTruthsCount ?? 0;
  const daresCreatedCount = profile.profile?.createdDaresCount ?? 0;

  return (
    <View style={[styles.root, { backgroundColor: c.green }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={c.green}
      />

      <View style={[styles.screen, { backgroundColor: c.bg }]}>
        <AccountScreenHeader
          title="Truth or Dare"
          headerGreen={c.green}
          titleColor={c.white}
          borderBottomColor="rgba(207,247,238,0.20)"
          leftIcon="settings"
          onPressLeft={() => router.push('/settings')}
          rightIcon="notifications-none"
          onPressRight={() => router.push('/notifications')}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ProfileIdentityCard
            name={displayName}
            username={username}
            initials={displayName.charAt(0).toUpperCase() || '?'}
            bio={bio}
            backgroundColor={c.bg}
            textColor={c.text}
            subTextColor={c.sub}
            onPressEdit={profile.openEditModal}
            onPressPhoto={profile.openPhotoModal}
          />

          <ProfileStatsGrid
            followers="—"
            following="—"
            truthsCreated={truthsCreatedCount}
            daresCreated={daresCreatedCount}
          />

          <ProfileAchievements
            textColor={c.text}
            subTextColor={c.sub}
          />

          <ProfileClubCard
            backgroundColor={c.surface}
            borderColor={c.outline}
            textColor={c.text}
            subTextColor={c.sub}
            iconColor={c.green}
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

      <ProfileModals
        editVisible={profile.editVisible}
        photoVisible={profile.photoVisible}
        displayName={profile.displayName}
        username={profile.username}
        bio={profile.bio}
        setBio={profile.setBio}
        setDisplayName={profile.setDisplayName}
        setUsername={profile.setUsername}
        onCloseEdit={profile.closeEditModal}
        onSaveProfile={profile.saveProfile}
        onClosePhoto={profile.closePhotoModal}
        onOpenCamera={profile.openCamera}
        onOpenGallery={profile.openGallery}
        onRemovePhoto={profile.removePhoto}
      />
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