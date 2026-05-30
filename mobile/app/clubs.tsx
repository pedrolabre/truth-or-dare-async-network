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
import { Href, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FeedBottomNav from '../components/feed/FeedBottomNav';

import ClubsSegmentedTabs from '../components/clubs/ClubsSegmentedTabs';
import ClubsSearchInput from '../components/clubs/ClubsSearchInput';
import ClubsEmptyState from '../components/clubs/ClubsEmptyState';
import ClubsFab from '../components/clubs/ClubsFab';
import ClubListCard from '../components/clubs/ClubListCard';
import ClubDiscoverCard from '../components/clubs/ClubDiscoverCard';
import ClubsSkeletonList from '../components/clubs/ClubsSkeletonList';

import { useTheme } from '../context/ThemeContext';
import {
  DARK_CLUBS_COLORS,
  LIGHT_CLUBS_COLORS,
} from '../constants/clubsTheme';
import { useClubsScreen } from '../hooks/useClubsScreen';
import { useNotificationsUnreadCount } from '../hooks/useNotificationsUnreadCount';
import { FEED_BOTTOM_NAV_ITEMS } from '../data/feedMock';
import type { ClubDiscoverItem, ClubListItem } from '../types/clubs';

export default function ClubsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = isDark ? DARK_CLUBS_COLORS : LIGHT_CLUBS_COLORS;
  useNotificationsUnreadCount();

  const {
    activeTab,
    activeContentState,
    clubActionErrorMessage,
    errorMessage,
    hasSearchQuery,
    isRefreshing,
    joiningClubIds,
    myClubs,
    query,
    visibleDiscoverClubs,
    setQuery,
    handleChangeTab,
    handleRefresh,
    handleJoinClub,
    handleRetry,
  } = useClubsScreen();

  const trimmedQuery = query.trim();

  function handleOpenClub(club: ClubListItem | ClubDiscoverItem) {
    router.push(`/clubs/${encodeURIComponent(club.id)}` as Href);
  }

  function renderContent() {
    if (activeContentState === 'loading') {
      return <ClubsSkeletonList colors={colors} />;
    }

    if (activeContentState === 'error') {
      const isMyClubsTab = activeTab === 'my-clubs';
      const isSearchError = activeTab === 'discover' && hasSearchQuery;
      const errorTitle = isSearchError
        ? 'Não foi possível buscar clubes'
        : isMyClubsTab
          ? 'Não foi possível carregar seus clubes'
          : 'Não foi possível carregar clubes para descobrir';
      const errorDescription =
        errorMessage ??
        (isSearchError
          ? 'A descoberta carregada continua disponível ao limpar a busca.'
          : 'Verifique sua conexão e tente novamente mais tarde.');

      return (
        <ClubsEmptyState
          colors={colors}
          title={errorTitle}
          description={errorDescription}
          iconName="error-outline"
          actionLabel="Tentar novamente"
          onAction={handleRetry}
        />
      );
    }

    if (activeContentState === 'search-empty') {
      return (
        <ClubsEmptyState
          colors={colors}
          title="Nenhum clube encontrado"
          description={
            trimmedQuery
              ? `A busca ainda não retornou resultados para "${trimmedQuery}".`
              : 'Digite um termo para procurar clubes.'
          }
          iconName="search"
        />
      );
    }

    if (activeContentState === 'empty') {
      const isMyClubsTab = activeTab === 'my-clubs';

      return (
        <ClubsEmptyState
          colors={colors}
          title={
            isMyClubsTab
              ? 'Você ainda não participa de clubes'
              : 'Nenhum clube disponível para descobrir'
          }
          description={
            isMyClubsTab
              ? 'Quando você entrar ou criar um clube, ele aparecerá aqui.'
              : 'Não encontramos clubes públicos para mostrar agora.'
          }
          iconName={isMyClubsTab ? 'groups' : 'explore'}
        />
      );
    }

    if (activeTab === 'my-clubs') {
      return (
        <View style={styles.cardsList}>
          {myClubs.map((club) => (
            <ClubListCard
              key={club.id}
              club={club}
              colors={colors}
              onPress={handleOpenClub}
            />
          ))}
        </View>
      );
    }

    return (
      <View style={styles.cardsList}>
        {visibleDiscoverClubs.map((club) => (
          <ClubDiscoverCard
            key={club.id}
            club={club}
            colors={colors}
            isJoining={joiningClubIds.includes(club.id)}
            onJoin={handleJoinClub}
            onPress={handleOpenClub}
          />
        ))}
      </View>
    );
  }

  function handleBottomNavSelect(key: 'play' | 'search' | 'clubs' | 'profile') {
    switch (key) {
      case 'play':
        router.replace('/feed');
        return;
      case 'search':
        router.replace({
          pathname: '/search',
          params: { focus: '1' },
        });
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
        <View
          style={[
            styles.topHeader,
            {
              paddingTop: insets.top,
              backgroundColor: colors.green,
              borderBottomColor: isDark
                ? 'rgba(255,255,255,0.10)'
                : 'rgba(207,247,238,0.20)',
            },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[styles.brandTitle, { color: isDark ? colors.white : '#cff7ee' }]}
          >
            Truth or Dare
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil"
            hitSlop={8}
            onPress={() => {
              router.push('/profile');
            }}
            style={({ pressed }) => [
              styles.profileAvatar,
              {
                backgroundColor: isDark ? colors.surfaceSoft : colors.surface,
                borderColor: isDark
                  ? 'rgba(255,255,255,0.30)'
                  : 'rgba(207,247,238,0.45)',
              },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.profileAvatarText, { color: colors.text }]}>
              RM
            </Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.green}
                colors={[colors.green]}
                progressBackgroundColor={colors.surface}
              />
            }
          >
            <View style={styles.headerSection}>
              <Text style={[styles.title, { color: colors.text }]}>
                Clubes
              </Text>
              <Text style={[styles.subtitle, { color: colors.subText }]}>
                Conecte-se com grupos e jogue junto.
              </Text>
            </View>

            <ClubsSegmentedTabs
              activeTab={activeTab}
              onChangeTab={handleChangeTab}
              colors={colors}
            />

            {activeTab === 'discover' ? (
              <ClubsSearchInput
                value={query}
                onChangeText={setQuery}
                colors={colors}
              />
            ) : null}

            {activeTab === 'discover' && clubActionErrorMessage ? (
              <View
                style={[
                  styles.actionErrorBox,
                  {
                    backgroundColor: colors.redSoft,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.actionErrorText, { color: colors.red }]}>
                  {clubActionErrorMessage}
                </Text>
              </View>
            ) : null}

            {renderContent()}
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
    paddingTop: 26,
    paddingBottom: 156,
    gap: 24,
  },
  topHeader: {
    minHeight: 72,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  brandTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
  },
  profileAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  profileAvatarText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
  },
  headerSection: {
    gap: 6,
  },
  title: {
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  cardsList: {
    gap: 18,
  },
  actionErrorBox: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionErrorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.82,
  },
});
