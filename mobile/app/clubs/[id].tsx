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

import ClubDetailStateCard from '../../components/clubs/ClubDetailStateCard';
import {
  DARK_CLUBS_COLORS,
  LIGHT_CLUBS_COLORS,
} from '../../constants/clubsTheme';
import { useTheme } from '../../context/ThemeContext';
import { useClubDetailsScreen } from '../../hooks/useClubDetailsScreen';
import type { ClubDetail } from '../../types/clubs';

type ClubDetailRouteParams = {
  id?: string | string[];
};

function getClubIconName(club: ClubDetail) {
  return (
    (club.iconName as keyof typeof MaterialIcons.glyphMap | undefined) ??
    'groups'
  );
}

export default function ClubDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<ClubDetailRouteParams>();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = isDark ? DARK_CLUBS_COLORS : LIGHT_CLUBS_COLORS;
  const {
    club,
    clubId,
    contentState,
    errorMessage,
    isRefreshing,
    canRetry,
    handleRefresh,
    handleRetry,
  } = useClubDetailsScreen({
    clubId: params.id,
  });
  const headerTitle = club?.name ?? 'Clube';

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

    const iconName = getClubIconName(club);

    return (
      <View
        testID="club-detail-summary-card"
        style={[
          styles.detailCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <View style={styles.detailHeader}>
          <View style={[styles.clubIcon, { backgroundColor: colors.green }]}>
            <MaterialIcons name={iconName} size={30} color={colors.white} />
          </View>

          <View style={styles.titleStack}>
            <Text
              numberOfLines={2}
              style={[styles.clubName, { color: colors.text }]}
            >
              {club.name}
            </Text>
            <Text
              testID="club-detail-id"
              style={[styles.clubId, { color: colors.subText }]}
            >
              ID: {clubId}
            </Text>
          </View>
        </View>

        {errorMessage ? (
          <View
            style={[
              styles.refreshErrorBox,
              {
                backgroundColor: colors.redSoft,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.refreshErrorText, { color: colors.red }]}>
              {errorMessage}
            </Text>
          </View>
        ) : null}
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
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
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
    justifyContent: 'center',
  },
  detailCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  clubIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleStack: {
    flex: 1,
    gap: 4,
  },
  clubName: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
  },
  clubId: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  refreshErrorBox: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  refreshErrorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
  },
});
