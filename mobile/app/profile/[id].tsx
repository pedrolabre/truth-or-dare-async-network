import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AccountScreenHeader from '../../components/account/AccountScreenHeader';
import { useTheme } from '../../context/ThemeContext';
import { getPublicUserProfile } from '../../services/api';
import type { PublicUserProfile } from '../../types/user';

const LIGHT = {
  bg: '#f5fbf6',
  surface: '#eaefea',
  surfaceSoft: '#eff5f0',
  text: '#171d1a',
  sub: '#3d4944',
  outline: '#bccac2',
  green: '#5A8363',
  greenSoft: 'rgba(90,131,99,0.10)',
  red: '#D70015',
  redSoft: 'rgba(215,0,21,0.10)',
  white: '#ffffff',
};

const DARK = {
  bg: '#121212',
  surface: '#232323',
  surfaceSoft: '#1b1d1b',
  text: '#f5fbf6',
  sub: '#bccac2',
  outline: '#444746',
  green: '#5A8363',
  greenSoft: 'rgba(90,131,99,0.20)',
  red: '#E11D2E',
  redSoft: 'rgba(225,29,46,0.20)',
  white: '#f9f9f9',
};

const PRIVATE_PROFILE_NAME = 'Perfil privado';
const PRIVATE_PROFILE_LABEL = 'Perfil privado';

type RouteParams = {
  id?: string | string[];
};

function getRouteId(id: string | string[] | undefined) {
  return Array.isArray(id) ? id[0] : id;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function PublicProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<RouteParams>();
  const { isDark } = useTheme();
  const colors = isDark ? DARK : LIGHT;
  const userId = getRouteId(params.id);
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!userId?.trim()) {
      setProfile(null);
      setErrorMessage('Perfil nao encontrado.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextProfile = await getPublicUserProfile(userId);
      setProfile(nextProfile);
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Nao foi possivel carregar este perfil.';

      setProfile(null);
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const displayUsername = useMemo(() => {
    if (!profile?.username?.trim()) {
      return 'usuario';
    }

    return profile.username.replace(/^@/, '');
  }, [profile?.username]);

  const isRestrictedProfile = Boolean(
    profile &&
      profile.name === PRIVATE_PROFILE_NAME &&
      profile.levelLabel === PRIVATE_PROFILE_LABEL &&
      !profile.username,
  );
  const initials = profile ? getInitials(profile.name) || '?' : '?';

  function renderContent() {
    if (isLoading) {
      return (
        <View
          accessibilityRole="text"
          accessibilityLabel="Carregando perfil publico"
          style={[styles.stateCard, { backgroundColor: colors.surface }]}
        >
          <ActivityIndicator color={colors.green} />
          <Text style={[styles.stateText, { color: colors.sub }]}>
            Carregando perfil...
          </Text>
        </View>
      );
    }

    if (errorMessage || !profile) {
      return (
        <View
          accessibilityRole="alert"
          style={[
            styles.stateCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outline,
            },
          ]}
        >
          <MaterialIcons name="person-off" size={32} color={colors.red} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>
            Perfil indisponivel
          </Text>
          <Text style={[styles.stateText, { color: colors.sub }]}>
            {errorMessage ?? 'Nao foi possivel carregar este perfil.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tentar carregar perfil novamente"
            onPress={() => {
              void loadProfile();
            }}
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: colors.red },
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name="refresh" size={18} color={colors.white} />
            <Text style={[styles.retryText, { color: colors.white }]}>
              Tentar novamente
            </Text>
          </Pressable>
        </View>
      );
    }

    if (isRestrictedProfile) {
      return (
        <View
          accessibilityRole="text"
          accessibilityLabel="Perfil privado"
          style={[
            styles.identityCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outline,
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.green }]}>
            <MaterialIcons name="lock-outline" size={34} color={colors.white} />
          </View>

          <Text style={[styles.name, { color: colors.text }]}>
            Perfil privado
          </Text>
          <Text style={[styles.bio, { color: colors.sub }]}>
            Este perfil nao exibe dados publicos para sua conta.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar para busca"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.restrictedBackButton,
              {
                backgroundColor: colors.surfaceSoft,
                borderColor: colors.outline,
              },
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name="arrow-back" size={18} color={colors.text} />
            <Text style={[styles.secondaryActionText, { color: colors.text }]}>
              Voltar
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.stack}>
        <View
          style={[
            styles.identityCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outline,
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.green }]}>
            <Text style={[styles.avatarText, { color: colors.white }]}>
              {initials}
            </Text>
          </View>

          <Text style={[styles.name, { color: colors.text }]}>
            {profile.name}
          </Text>
          <Text style={[styles.username, { color: colors.sub }]}>
            @{displayUsername}
          </Text>

          <View style={[styles.levelBadge, { backgroundColor: colors.greenSoft }]}>
            <MaterialIcons name="military-tech" size={16} color={colors.green} />
            <Text style={[styles.levelText, { color: colors.green }]}>
              {profile.levelLabel}
            </Text>
          </View>

          {profile.bio?.trim() ? (
            <Text style={[styles.bio, { color: colors.sub }]}>{profile.bio}</Text>
          ) : (
            <Text style={[styles.bio, { color: colors.sub }]}>
              Este usuario ainda nao adicionou uma bio publica.
            </Text>
          )}

          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Desafiar ${profile.name}`}
              onPress={() => router.push('/create-challenge')}
              style={({ pressed }) => [
                styles.primaryAction,
                { backgroundColor: colors.red },
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons name="bolt" size={18} color={colors.white} />
              <Text style={[styles.primaryActionText, { color: colors.white }]}>
                Desafiar
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar para busca"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.secondaryAction,
                {
                  backgroundColor: colors.surfaceSoft,
                  borderColor: colors.outline,
                },
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons name="arrow-back" size={18} color={colors.text} />
              <Text style={[styles.secondaryActionText, { color: colors.text }]}>
                Voltar
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <PublicStat
            value={profile.stats.createdTruthsCount}
            label="Verdades criadas"
            icon="question-answer"
            colors={colors}
          />
          <PublicStat
            value={profile.stats.createdDaresCount}
            label="Desafios criados"
            icon="local-fire-department"
            colors={colors}
          />
          <PublicStat
            value={profile.stats.activePublicClubsCount}
            label="Clubes publicos"
            icon="groups"
            colors={colors}
          />
          <PublicStat
            value={profile.stats.publishedClubPromptsCount}
            label="Prompts publicados"
            icon="auto-awesome"
            colors={colors}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.green }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.green}
      />

      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <AccountScreenHeader
          title="Perfil publico"
          headerGreen={colors.green}
          titleColor={colors.white}
          borderBottomColor="rgba(207,247,238,0.20)"
          leftIcon="arrow-back"
          onPressLeft={() => router.back()}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      </View>
    </View>
  );
}

type PublicStatProps = {
  value: number;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  colors: typeof LIGHT;
};

function PublicStat({ value, label, icon, colors }: PublicStatProps) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.outline,
        },
      ]}
    >
      <MaterialIcons name={icon} size={22} color={colors.green} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.sub }]}>{label}</Text>
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
    flexGrow: 1,
    padding: 16,
    paddingBottom: 28,
  },
  stack: {
    gap: 16,
  },
  identityCard: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: 0,
  },
  name: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  username: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  levelBadge: {
    marginTop: 14,
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  levelText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  bio: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionRow: {
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  primaryAction: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  secondaryAction: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  restrictedBackButton: {
    width: '100%',
    minHeight: 48,
    marginTop: 20,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    minHeight: 118,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  stateCard: {
    flexGrow: 1,
    minHeight: 260,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  stateText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
