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
    results,
    isLoading,
    isInitialState,
    isEmptyResult,
    setQuery,
    setActiveFilter,
  } = useSearchScreen();

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
                Procure usuários e clubes quando o backend dessas áreas estiver disponível.
              </Text>
            </View>

            <View style={styles.searchBlock}>
              <SearchBar
                value={query}
                onChangeText={setQuery}
                colors={colors}
                onPressFilter={() => {
                  // filtro avançado futuro
                }}
              />

              <SearchFilterPills
                activeFilter={activeFilter}
                onSelect={setActiveFilter}
                colors={colors}
              />
            </View>

            {isLoading ? (
              <View
                style={[
                  styles.infoCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.infoText, { color: colors.subText }]}>
                  Carregando resultados...
                </Text>
              </View>
            ) : null}

            {isInitialState ? (
              <View
                style={[
                  styles.placeholderCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.placeholderTitle, { color: colors.text }]}>
                  Busca pronta para integração
                </Text>
                <Text style={[styles.placeholderText, { color: colors.subText }]}>
                  Digite um termo para testar a estrutura da tela. Quando o backend estiver
                  conectado, os resultados reais de usuários e clubes aparecerão aqui.
                </Text>
              </View>
            ) : null}

            {!isInitialState && results.users.length > 0 ? (
              <SearchSection title="Usuários" colors={colors}>
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

            {!isInitialState && results.clubs.length > 0 ? (
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

            {isEmptyResult ? (
              <SearchEmptyState
                colors={colors}
                title="Nenhum resultado disponível"
                description="Ainda não há dados reais conectados para essa busca, ou sua pesquisa não retornou resultados."
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
  infoCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  placeholderCard: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 10,
  },
  placeholderTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  placeholderText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});