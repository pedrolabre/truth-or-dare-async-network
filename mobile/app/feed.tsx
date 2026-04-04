import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  RefreshControl,
} from 'react-native';
import FeedBottomNav from '../components/feed/FeedBottomNav';
import FeedCardClub from '../components/feed/FeedCardClub';
import FeedCardDare from '../components/feed/FeedCardDare';
import FeedCardTruth from '../components/feed/FeedCardTruth';
import FeedFab from '../components/feed/FeedFab';
import FeedFilters from '../components/feed/FeedFilters';
import FeedHeader from '../components/feed/FeedHeader';
import { FEED_BOTTOM_NAV_ITEMS, FEED_FILTERS, FEED_ITEMS } from '../data/feedMock';
import { getFeed, type FeedItem } from '../services/api';
import { useFeedState } from '../hooks/useFeedState';
import { useDeleteChallenge } from '../hooks/useDeleteChallenge';
import { useRouter } from 'expo-router';

const LIGHT_COLORS = {
  surfaceBright: '#f5fbf6',
  onSurface: '#171d1a',
  onSurfaceVariant: '#3d4944',
  surfaceContainerHigh: '#e4eae5',
  surfaceContainer: '#eaefea',
  surfaceContainerLow: '#eff5f0',
  surfaceDim: '#d6dbd7',
  outline: '#6d7a74',
  outlineVariant: '#bccac2',
  primary: '#006950',
  secondary: '#3e6657',
  tertiary: '#D70015',
  onPrimary: '#ffffff',
  onSecondary: '#ffffff',
  onTertiary: '#ffffff',
  primaryContainer: '#008466',
  secondaryContainer: '#c0ecd9',
  tertiaryFixed: '#ffdad6',
  headerGreen: '#5A8363',
  greenAccent: '#5A8363',
  greenSoft: '#5A8363',
  greenText: '#5A8363',
  greenBgSoft: 'rgba(90,131,99,0.10)',
  redBgSoft: 'rgba(215,0,21,0.10)',
  white: '#ffffff',
};

const DARK_COLORS = {
  surfaceBright: '#121212',
  onSurface: '#f5fbf6',
  onSurfaceVariant: '#bccac2',
  surfaceContainerHigh: '#2b2b2b',
  surfaceContainer: '#232323',
  surfaceContainerLow: '#1a1c1a',
  surfaceDim: '#121212',
  outline: '#8f9993',
  outlineVariant: '#444746',
  primary: '#7fd6b4',
  secondary: '#9dcfb9',
  tertiary: '#E11D2E',
  onPrimary: '#003829',
  onSecondary: '#171d1a',
  onTertiary: '#ffffff',
  primaryContainer: '#1e5c4a',
  secondaryContainer: '#29463b',
  tertiaryFixed: '#4a1218',
  headerGreen: '#5A8363',
  greenAccent: '#68dbb4',
  greenSoft: '#5A8363',
  greenText: '#68dbb4',
  greenBgSoft: 'rgba(90,131,99,0.20)',
  redBgSoft: 'rgba(215,0,21,0.20)',
  white: '#f9f9f9',
};

export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS;

  const router = useRouter();

  const {
    activeFilter,
    setActiveFilter,
    activeTab,
    setActiveTab,
    toggleLike,
    isLiked,
  } = useFeedState();

  const [apiItems, setApiItems] = useState<FeedItem[]>(FEED_ITEMS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { handleDelete } = useDeleteChallenge(setApiItems);

  const loadFeed = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage('');

      const data = await getFeed();

      setApiItems(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível carregar o feed.';
      console.log('Não foi possível carregar o feed da API:', error);
      setErrorMessage(message);
      setApiItems(FEED_ITEMS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  const filteredItems = useMemo(() => {
    switch (activeFilter) {
      case 'friends':
        return apiItems.filter((item) => item.type !== 'club');
      case 'party':
        return apiItems.filter((item) => item.type !== 'truth');
      case 'spicy':
        return apiItems.filter((item) => item.type !== 'club');
      case 'popular':
      default:
        return apiItems;
    }
  }, [activeFilter, apiItems]);

  return (
    <View style={[styles.root, { backgroundColor: COLORS.headerGreen }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={COLORS.headerGreen}
      />

      <View style={[styles.screen, { backgroundColor: COLORS.surfaceBright }]}>
        <View pointerEvents="none" style={[styles.bg, { opacity: isDark ? 0.1 : 0.16 }]}>
          <View
            style={[
              styles.blurBlob,
              styles.blurTopLeft,
              { backgroundColor: COLORS.primaryContainer },
            ]}
          />
          <View
            style={[
              styles.blurBlob,
              styles.blurRight,
              { backgroundColor: COLORS.secondaryContainer },
            ]}
          />
          <View
            style={[
              styles.blurBlob,
              styles.blurBottom,
              { backgroundColor: COLORS.tertiaryFixed },
            ]}
          />
        </View>

        <FeedHeader
          title="Truth or Dare"
          initials=""
          headerGreen={COLORS.headerGreen}
          white={COLORS.white}
          surfaceContainer={COLORS.surfaceContainer}
          borderBottomColor={
            isDark ? 'rgba(255,255,255,0.10)' : 'rgba(207,247,238,0.20)'
          }
          avatarBorderColor={
            isDark ? 'rgba(255,255,255,0.30)' : 'rgba(207,247,238,0.30)'
          }
          avatarBackgroundColor={isDark ? '#121212' : COLORS.surfaceContainer}
          onPressNotifications={() => {
            console.log('Notificações em breve');
          }}
        />

        <View style={styles.content}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadFeed(true)}
                colors={[COLORS.tertiary]}
                tintColor={COLORS.tertiary}
              />
            }
          >
            <View style={styles.introSection}>
              <Text style={[styles.screenTitle, { color: COLORS.onSurface }]}>
                Truth or Dare
              </Text>
              <Text style={[styles.screenSubtitle, { color: COLORS.onSurfaceVariant }]}>
                O que vamos encarar hoje?
              </Text>
            </View>

            <FeedFilters
              filters={FEED_FILTERS}
              activeFilter={activeFilter}
              onSelectFilter={setActiveFilter}
              selectedBackgroundColor={COLORS.tertiary}
              selectedTextColor="#ffffff"
              unselectedBackgroundColor={COLORS.surfaceContainer}
              unselectedTextColor={COLORS.onSurface}
              unselectedBorderColor={COLORS.outlineVariant}
            />

            {loading ? (
              <View style={styles.statusWrapper}>
                <ActivityIndicator size="small" color={COLORS.tertiary} />
                <Text style={[styles.statusText, { color: COLORS.onSurfaceVariant }]}>
                  Carregando feed...
                </Text>
              </View>
            ) : null}

            {!loading && errorMessage ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: COLORS.surfaceContainer,
                    borderColor: COLORS.outlineVariant,
                  },
                ]}
              >
                <Text style={[styles.errorText, { color: COLORS.onSurfaceVariant }]}>
                  {errorMessage}
                </Text>
                <Text
                  style={[styles.retryText, { color: COLORS.tertiary }]}
                  onPress={() => {
                    void loadFeed(true);
                  }}
                >
                  Tentar novamente
                </Text>
              </View>
            ) : null}

            <View style={styles.feedList}>
              {filteredItems.map((item) => {
                if (item.type === 'truth') {
                  return (
                    <FeedCardTruth
                      key={item.id}
                      item={item}
                      backgroundColor={COLORS.surfaceContainer}
                      borderLeftColor={COLORS.greenSoft}
                      badgeBackgroundColor={COLORS.greenBgSoft}
                      badgeTextColor={COLORS.greenText}
                      titleColor={COLORS.onSurface}
                      metaColor={COLORS.outline}
                      actionColor={COLORS.outline}
                      firstAvatarBackgroundColor={isDark ? '#5A8363' : '#c0ecd9'}
                      firstAvatarTextColor={isDark ? '#ffffff' : '#002117'}
                      secondAvatarBackgroundColor={isDark ? '#D70015' : '#ffdad6'}
                      secondAvatarTextColor={isDark ? '#ffffff' : '#410002'}
                      extraAvatarBackgroundColor={COLORS.surfaceDim}
                      extraAvatarTextColor={COLORS.onSurface}
                      extraAvatarBorderColor={COLORS.surfaceContainer}
                      onPressLike={toggleLike}
                      onPressComments={(id) => {
                        console.log('Abrir comentários do card:', id);
                      }}
                      onPressDelete={() => handleDelete(item)}
                      liked={isLiked(item.id)}
                    />
                  );
                }

                if (item.type === 'dare') {
                  return (
                    <FeedCardDare
                      key={item.id}
                      item={item}
                      backgroundColor={COLORS.surfaceContainer}
                      borderLeftColor={COLORS.tertiary}
                      lockColor={COLORS.outline}
                      friendAvatarBackgroundColor={
                        isDark ? '#5A8363' : COLORS.surfaceContainerLow
                      }
                      friendAvatarBorderColor={COLORS.outlineVariant}
                      friendAvatarTextColor={COLORS.onSurface}
                      challengerNameColor={COLORS.onSurface}
                      challengerMetaColor={COLORS.outline}
                      badgeBackgroundColor={COLORS.redBgSoft}
                      badgeTextColor={COLORS.tertiary}
                      titleColor={COLORS.onSurface}
                      progressCardBackgroundColor={COLORS.surfaceContainerLow}
                      progressCardBorderColor={
                        isDark ? 'rgba(255,255,255,0.05)' : 'rgba(188,202,194,0.30)'
                      }
                      progressLabelColor={COLORS.onSurfaceVariant}
                      progressExpiryColor={COLORS.tertiary}
                      progressTrackColor={
                        isDark ? 'rgba(255,255,255,0.10)' : COLORS.surfaceDim
                      }
                      progressFillColor={COLORS.tertiary}
                      primaryButtonBackgroundColor={COLORS.tertiary}
                      primaryButtonTextColor="#ffffff"
                      shareIconColor={COLORS.outline}
                      onPressAccept={(id) => {
                        console.log('Aceitar desafio:', id);
                      }}
                      onPressShare={(id) => {
                        console.log('Compartilhar desafio:', id);
                      }}
                      onPressDelete={() => handleDelete(item)}
                    />
                  );
                }

                return (
                  <FeedCardClub
                    key={item.id}
                    item={item}
                    backgroundColor={COLORS.surfaceContainer}
                    borderColor={
                      isDark ? 'rgba(255,255,255,0.10)' : 'rgba(188,202,194,0.50)'
                    }
                    iconBackgroundColor={COLORS.greenBgSoft}
                    iconColor={COLORS.greenText}
                    titleColor={COLORS.onSurface}
                    badgeBackgroundColor={COLORS.greenBgSoft}
                    badgeTextColor={COLORS.greenText}
                    quoteBorderColor={
                      isDark ? 'rgba(90,131,99,0.50)' : 'rgba(90,131,99,0.30)'
                    }
                    quoteTextColor={COLORS.onSurface}
                    metaColor={COLORS.outline}
                    actionColor={COLORS.greenText}
                    onPressAnswers={(id) => {
                      console.log('Ver respostas do clube:', id);
                    }}
                  />
                );
              })}
            </View>
          </ScrollView>

          <FeedFab
            backgroundColor={COLORS.tertiary}
            onPress={() => {
              router.push('/create-challenge');
            }}
          />
        </View>

        <FeedBottomNav
          items={FEED_BOTTOM_NAV_ITEMS}
          activeKey={activeTab}
          onSelect={(key) => {
            setActiveTab(key);
            console.log(`Abrir rota futura: ${key}`);
          }}
          backgroundColor={COLORS.headerGreen}
          borderTopColor={
            isDark ? 'rgba(255,255,255,0.10)' : 'rgba(207,247,238,0.10)'
          }
          activeBackgroundColor={COLORS.tertiary}
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
  bg: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blurBlob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blurTopLeft: {
    top: -100,
    left: -90,
    width: 280,
    height: 280,
  },
  blurRight: {
    top: '30%',
    right: -100,
    width: 220,
    height: 220,
  },
  blurBottom: {
    bottom: -120,
    left: '15%',
    width: 340,
    height: 340,
  },
  content: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 104,
  },
  introSection: {
    marginBottom: 18,
  },
  screenTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -1.1,
  },
  screenSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  statusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '800',
  },
  feedList: {
    gap: 16,
    paddingBottom: 8,
  },
});