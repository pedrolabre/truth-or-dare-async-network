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

import SearchBar from '../components/search/SearchBar';
import SearchFilterPills from '../components/search/SearchFilterPills';
import SearchSection from '../components/search/SearchSection';
import SearchUserResultCard from '../components/search/SearchUserResultCard';
import SearchClubResultCard from '../components/search/SearchClubResultCard';
import SearchEmptyState from '../components/search/SearchEmptyState';
import SearchRecentSearches from '../components/search/SearchRecentSearches';
import SearchRecommendedUsers from '../components/search/SearchRecommendedUsers';
import SearchTrendingClubs from '../components/search/SearchTrendingClubs';
import SearchSkeleton from '../components/search/SearchSkeleton';
import SearchErrorState from '../components/search/SearchErrorState';

import { useTheme } from '../context/ThemeContext';
import {
  DARK_SEARCH_COLORS,
  LIGHT_SEARCH_COLORS,
} from '../constants/searchTheme';
import { useSearchScreen } from '../hooks/useSearchScreen';
import { FEED_BOTTOM_NAV_ITEMS } from '../data/feedMock';

export default function SearchScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = isDark ? DARK_SEARCH_COLORS : LIGHT_SEARCH_COLORS;

  const {
    query,
    activeFilter,
    recentSearches,
    recommendedUsers,
    trendingClubs,
    results,
    isLoading,
    isInitialState,
    isEmptyResult,
    error,
    setQuery,
    setActiveFilter,
    retry,
    clearQuery,
    onPressFilter,
    removeRecent,
    clearAllRecent,
    onPressRecent,
  } = useSearchScreen();

  const shouldShowInitialState = isInitialState && !isLoading && !error;
  const shouldShowResults = !isInitialState && !isLoading && !error;
  const shouldShowEmptyState = shouldShowResults && isEmptyResult;

  function handleBottomNavSelect(key: 'play' | 'search' | 'clubs' | 'profile') {
    switch (key) {
      case 'play':
        router.replace('/feed');
        return;
      case 'search':
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

        <View style={styles.content}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.introSection}>
              <Text style={[styles.screenTitle, { color: colors.text }]}>
                Buscar
              </Text>
              <Text style={[styles.screenSubtitle, { color: colors.subText }]}>
                Encontre usuarios, clubes e novas conexoes para jogar.
              </Text>
            </View>

            <View style={styles.searchBlock}>
              <SearchBar
                value={query}
                onChangeText={setQuery}
                colors={colors}
                onClear={clearQuery}
                onPressFilter={onPressFilter}
              />

              <SearchFilterPills
                activeFilter={activeFilter}
                onSelect={setActiveFilter}
                colors={colors}
              />
            </View>

            {isLoading ? <SearchSkeleton colors={colors} /> : null}

            {!isLoading && error ? (
              <SearchErrorState
                colors={colors}
                message={error}
                onRetry={() => {
                  void retry();
                }}
              />
            ) : null}

            {shouldShowInitialState && recentSearches.length > 0 ? (
              <SearchSection title="Buscas recentes" colors={colors}>
                <SearchRecentSearches
                  items={recentSearches}
                  colors={colors}
                  onPressItem={(item) => {
                    void onPressRecent(item);
                  }}
                  onRemoveItem={(id) => {
                    void removeRecent(id);
                  }}
                  onClearAll={() => {
                    void clearAllRecent();
                  }}
                />
              </SearchSection>
            ) : null}

            {shouldShowInitialState && recommendedUsers.length > 0 ? (
              <SearchSection title="Usuarios recomendados" colors={colors}>
                <SearchRecommendedUsers
                  users={recommendedUsers}
                  colors={colors}
                />
              </SearchSection>
            ) : null}

            {shouldShowInitialState && trendingClubs.length > 0 ? (
              <SearchSection title="Clubes em alta" colors={colors}>
                <SearchTrendingClubs
                  clubs={trendingClubs}
                  colors={colors}
                />
              </SearchSection>
            ) : null}

            {shouldShowResults && results.users.length > 0 ? (
              <SearchSection title="Usuarios" colors={colors}>
                {results.users.map((user) => (
                  <SearchUserResultCard
                    key={user.id}
                    user={user}
                    colors={colors}
                    onPress={() => {
                      // abrir perfil real quando existir rota/endpoint
                    }}
                    onPressAction={() => {
                      // abrir perfil real quando existir rota/endpoint
                    }}
                  />
                ))}
              </SearchSection>
            ) : null}

            {shouldShowResults && results.clubs.length > 0 ? (
              <SearchSection title="Clubes" colors={colors}>
                {results.clubs.map((club) => (
                  <SearchClubResultCard
                    key={club.id}
                    club={club}
                    colors={colors}
                    onPress={() => {
                      // abrir clube real quando existir rota/endpoint
                    }}
                    onPressAction={() => {
                      // abrir clube real quando existir rota/endpoint
                    }}
                  />
                ))}
              </SearchSection>
            ) : null}

            {shouldShowEmptyState ? (
              <SearchEmptyState
                colors={colors}
                title="Nenhum resultado encontrado"
                description="Tente buscar outro nome, usuario ou clube para continuar explorando."
              />
            ) : null}
          </ScrollView>
        </View>

        <FeedBottomNav
          items={FEED_BOTTOM_NAV_ITEMS}
          activeKey="search"
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
    paddingBottom: 28,
    gap: 22,
  },
  introSection: {
    gap: 6,
  },
  screenTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -1.1,
  },
  screenSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  searchBlock: {
    gap: 14,
  },
});
