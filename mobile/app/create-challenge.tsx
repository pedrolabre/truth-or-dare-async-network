import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CreateChallengeCancelModal from '../components/create-challenge/CreateChallengeCancelModal';
import CreateChallengeComposer from '../components/create-challenge/CreateChallengeComposer';
import CreateChallengeTargetCard from '../components/create-challenge/CreateChallengeTargetCard';
import CreateChallengeTypeCard from '../components/create-challenge/CreateChallengeTypeCard';
import CreateChallengeUserPickerModal from '../components/create-challenge/CreateChallengeUserPickerModal';
import CreateChallengeDareSettings from '../components/create-challenge/CreateChallengeDareSettings';
import { useTheme } from '../context/ThemeContext';
import {
  createDare,
  createTruth,
  getUsers,
  type ChallengeUser,
} from '../services/api';

const LIGHT_COLORS = {
  surfaceBright: '#f5fbf6',
  onSurface: '#171d1a',
  onSurfaceVariant: '#3d4944',
  surfaceContainerHighest: '#dee4df',
  surfaceContainerHigh: '#e4eae5',
  surfaceContainer: '#eaefea',
  surfaceContainerLow: '#eff5f0',
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
  greenText: '#5A8363',
  white: '#ffffff',
  darkCardTop: '#171d1a',
  darkCardBottom: '#2c322f',
};

const DARK_COLORS = {
  surfaceBright: '#121212',
  onSurface: '#f5fbf6',
  onSurfaceVariant: '#cbd5e1',
  surfaceContainerHighest: '#333333',
  surfaceContainerHigh: '#282828',
  surfaceContainer: '#232323',
  surfaceContainerLow: '#1e1e1e',
  outline: '#94a3b8',
  outlineVariant: '#475569',
  primary: '#7fd6b4',
  secondary: '#9dcfb9',
  tertiary: '#D70015',
  onPrimary: '#ffffff',
  onSecondary: '#171d1a',
  onTertiary: '#ffffff',
  primaryContainer: '#1e5c4a',
  secondaryContainer: '#29463b',
  tertiaryFixed: '#4a1218',
  headerGreen: '#5A8363',
  greenAccent: '#68dbb4',
  greenText: '#68dbb4',
  white: '#f9f9f9',
  darkCardTop: '#1c1c1c',
  darkCardBottom: '#000000',
};

type ChallengeType = 'truth' | 'dare';

type SelectedUser = {
  id: string;
  name: string;
  initials: string;
} | null;

type PickerUser = {
  id: string;
  name: string;
  initials: string;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function mapUsersToPicker(users: ChallengeUser[]): PickerUser[] {
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    initials: getInitials(user.name),
  }));
}

export default function CreateChallengeScreen() {
  const { isDark } = useTheme();
  const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedType, setSelectedType] = useState<ChallengeType>('dare');
  const [challengeText, setChallengeText] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUserPickerModal, setShowUserPickerModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SelectedUser>(null);
  const [availableUsers, setAvailableUsers] = useState<PickerUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersErrorMessage, setUsersErrorMessage] = useState('');
  const [submitErrorMessage, setSubmitErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [durationMinutes, setDurationMinutes] = useState(60);

  const fieldLabel = useMemo(() => {
    return selectedType === 'truth' ? 'A VERDADE' : 'O DESAFIO';
  }, [selectedType]);

  const submitLabel = useMemo(() => {
    if (submitting) {
      return selectedType === 'truth'
        ? 'ENVIANDO VERDADE...'
        : 'ENVIANDO DESAFIO...';
    }

    return selectedType === 'truth' ? 'ENVIAR VERDADE' : 'ENVIAR DESAFIO';
  }, [selectedType, submitting]);

  function handleCancelCreation() {
    if (submitting) {
      return;
    }

    setShowCancelModal(true);
  }

  function confirmCancelCreation() {
    setShowCancelModal(false);
    router.replace('/feed');
  }

  const loadUsers = useCallback(async (query?: string) => {
    try {
      setLoadingUsers(true);
      setUsersErrorMessage('');

      const users = await getUsers(query);
      setAvailableUsers(mapUsersToPicker(users));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os usuários.';

      console.log('Não foi possível carregar usuários:', error);
      setUsersErrorMessage(message);
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  async function handleOpenUserPicker() {
    setShowUserPickerModal(true);
  }

  const handleRetryLoadUsers = useCallback(async () => {
    await loadUsers('');
  }, [loadUsers]);

  const handleSearchUsers = useCallback(
    async (query: string) => {
      await loadUsers(query);
    },
    [loadUsers],
  );

  async function handleSubmit() {
    const normalizedText = challengeText.trim();

    if (!normalizedText) {
      setSubmitErrorMessage(
        selectedType === 'truth'
          ? 'Digite o conteúdo da verdade antes de enviar.'
          : 'Digite o conteúdo do desafio antes de enviar.',
      );
      return;
    }

    if (!selectedUser) {
      setSubmitErrorMessage('Selecione um usuário antes de enviar.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitErrorMessage('');

      if (selectedType === 'truth') {
  await createTruth({
    content: normalizedText,
    targetUserId: selectedUser.id,
  });
} else {
  await createDare({
  content: normalizedText,
  targetUserId: selectedUser.id,
  maxAttempts,
  expiresAt: new Date(
    Date.now() + durationMinutes * 60 * 1000,
  ).toISOString(),
});
}

      router.replace('/feed');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar o challenge.';

      console.log('Não foi possível enviar challenge:', error);
      setSubmitErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  }

function renderHeader() {
  return (
    <View
      style={[
        styles.headerWrapper,
        {
          backgroundColor: COLORS.headerGreen,
          borderBottomColor: isDark
            ? 'rgba(255,255,255,0.10)'
            : 'rgba(207,247,238,0.20)',
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.headerContent}>
        <Pressable
          hitSlop={8}
          onPress={handleCancelCreation}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.headerButtonPressed,
          ]}
        >
          <MaterialIcons name="arrow-back" size={22} color={COLORS.white} />
        </Pressable>

        <Text
          numberOfLines={1}
          style={[styles.headerTitle, { color: COLORS.white }]}
        >
          Truth or Dare
        </Text>

        <View style={styles.headerSpacer} />
      </View>
    </View>
  );
}

  return (
    <View style={[styles.root, { backgroundColor: COLORS.headerGreen }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={COLORS.headerGreen}
      />

      <View style={[styles.screen, { backgroundColor: COLORS.surfaceBright }]}>
        <View
          pointerEvents="none"
          style={[styles.bg, { opacity: isDark ? 0.1 : 0.16 }]}
        >
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

        {renderHeader()}

        <View style={styles.content}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.introSection}>
              <Text style={[styles.screenTitle, { color: COLORS.greenText }]}>
                Escolha Sua Arma
              </Text>
              <Text
                style={[
                  styles.screenSubtitle,
                  { color: COLORS.onSurfaceVariant },
                ]}
              >
                Escolha uma categoria e envie um desafio para seus amigos.
              </Text>
            </View>

            <View style={styles.typeGrid}>
              <CreateChallengeTypeCard
                type="truth"
                selected={selectedType === 'truth'}
                title="VERDADE"
                description="Force uma resposta honesta."
                iconName="history-edu"
                ghostIconName="menu-book"
                backgroundColor={COLORS.headerGreen}
                borderColor={COLORS.headerGreen}
                iconColor="#ffffff"
                accentColor={COLORS.headerGreen}
                onPress={() => {
                  if (submitting) {
                    return;
                  }

                  setSubmitErrorMessage('');
                  setSelectedType('truth');
                }}
              />

              <CreateChallengeTypeCard
                type="dare"
                selected={selectedType === 'dare'}
                title="DESAFIO"
                description="Desafie-os a agir."
                iconName="bolt"
                ghostIconName="local-fire-department"
                backgroundColor={isDark ? COLORS.darkCardBottom : COLORS.darkCardTop}
                borderColor={COLORS.headerGreen}
                iconColor={isDark ? COLORS.greenAccent : '#cff7ee'}
                accentColor={COLORS.headerGreen}
                onPress={() => {
                  if (submitting) {
                    return;
                  }

                  setSubmitErrorMessage('');
                  setSelectedType('dare');
                }}
              />
            </View>

            <CreateChallengeComposer
              label={fieldLabel}
              value={challengeText}
              onChangeText={(text) => {
                setChallengeText(text);

                if (submitErrorMessage) {
                  setSubmitErrorMessage('');
                }
              }}
              placeholder="Digite sua pergunta ou desafio aqui..."
              labelColor={COLORS.outline}
              textColor={COLORS.onSurface}
              placeholderTextColor={
                isDark ? 'rgba(148,163,184,0.55)' : 'rgba(109,122,116,0.55)'
              }
              backgroundColor={COLORS.surfaceContainerLow}
              borderColor={COLORS.outlineVariant}
              actionBackgroundColor={COLORS.surfaceContainerHighest}
              actionIconColor={isDark ? COLORS.greenAccent : COLORS.outline}
              onPressRandom={() => {
                console.log('Gerar sugestão aleatória futuramente');
              }}
            />

           <CreateChallengeTargetCard
  label="DESAFIANDO"
  name={selectedUser?.name}
  initials={selectedUser?.initials}
  backgroundColor={COLORS.surfaceContainerHigh}
  borderColor={
    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(188,202,194,0.30)'
  }
  avatarBackgroundColor={COLORS.headerGreen}
  avatarTextColor="#ffffff"
  labelColor={COLORS.outline}
  nameColor={COLORS.onSurface}
  actionColor={COLORS.headerGreen}
  emptyTitleColor={COLORS.onSurface}
  emptySubtitleColor={COLORS.onSurfaceVariant}
  emptyIconColor="#ffffff"
  onPressChange={() => {
    if (submitting) {
      return;
    }

    setSubmitErrorMessage('');
    void handleOpenUserPicker();
  }}
/>

{selectedType === 'dare' && (
  <CreateChallengeDareSettings
    maxAttempts={maxAttempts}
    onChangeMaxAttempts={setMaxAttempts}
    durationMinutes={durationMinutes}
    onChangeDurationMinutes={setDurationMinutes}
    COLORS={COLORS}
  />
)}

{submitErrorMessage ? (
  <View
    style={[
      styles.inlineErrorBox,
      {
        backgroundColor: COLORS.surfaceContainerHigh,
        borderColor: COLORS.outlineVariant,
      },
    ]}
  >
                <Text
                  style={[
                    styles.inlineErrorText,
                    { color: COLORS.onSurfaceVariant },
                  ]}
                >
                  {submitErrorMessage}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => {
                if (submitting) {
                  return;
                }

                void handleSubmit();
              }}
              style={({ pressed }) => [
                styles.submitButton,
                {
                  backgroundColor: COLORS.tertiary,
                  opacity: submitting ? 0.78 : 1,
                },
                pressed && !submitting && styles.submitButtonPressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={COLORS.onTertiary} />
              ) : (
                <MaterialIcons name="send" size={22} color={COLORS.onTertiary} />
              )}

              <Text
                style={[styles.submitButtonText, { color: COLORS.onTertiary }]}
              >
                {submitLabel}
              </Text>
            </Pressable>

            {loadingUsers && !showUserPickerModal ? (
              <View style={styles.loadingUsersBox}>
                <ActivityIndicator size="small" color={COLORS.tertiary} />
                <Text
                  style={[
                    styles.loadingUsersText,
                    { color: COLORS.onSurfaceVariant },
                  ]}
                >
                  Carregando usuários...
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </View>

        <CreateChallengeCancelModal
          visible={showCancelModal}
          title="Cancelar criação?"
          description="Se você sair agora, todo o progresso será perdido."
          onKeepEditing={() => setShowCancelModal(false)}
          onConfirmCancel={confirmCancelCreation}
          backdropColor="rgba(0,0,0,0.5)"
          cardBackgroundColor={COLORS.surfaceContainerHigh}
          borderColor={COLORS.outlineVariant}
          iconBackgroundColor={COLORS.tertiaryFixed}
          iconColor={COLORS.tertiary}
          titleColor={COLORS.onSurface}
          descriptionColor={COLORS.onSurfaceVariant}
          keepEditingBackgroundColor={COLORS.surfaceContainerHighest}
          keepEditingTextColor={COLORS.onSurface}
          cancelBackgroundColor={COLORS.tertiary}
          cancelTextColor={COLORS.onTertiary}
        />

        <CreateChallengeUserPickerModal
  visible={showUserPickerModal}
  users={availableUsers}
  loading={loadingUsers}
  errorMessage={usersErrorMessage}
  onClose={() => setShowUserPickerModal(false)}
  onSelectUser={(user) => {
    setSelectedUser(user);
    setSubmitErrorMessage('');
  }}
  onRetry={handleRetryLoadUsers}
  onSearchUsers={handleSearchUsers}
  COLORS={COLORS}
/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
  borderBottomWidth: 1,
},
headerContent: {
  minHeight: 56,
  paddingHorizontal: 16,
  paddingVertical: 8,
  flexDirection: 'row',
  alignItems: 'center',
},
headerButton: {
  width: 36,
  height: 36,
  borderRadius: 999,
  alignItems: 'center',
  justifyContent: 'center',
},
headerButtonPressed: {
  opacity: 0.82,
  transform: [{ scale: 0.96 }],
},
headerTitle: {
  flex: 1,
  textAlign: 'center',
  fontSize: 21,
  fontWeight: '900',
  letterSpacing: -0.5,
},
headerSpacer: {
  width: 36,
  height: 36,
},
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
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 28,
    gap: 24,
  },
  introSection: {
    gap: 6,
  },
  screenTitle: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: -1.1,
  },
  screenSubtitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  typeGrid: {
    gap: 14,
  },
  inlineErrorBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  inlineErrorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  loadingUsersBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: -8,
  },
  loadingUsersText: {
    fontSize: 13,
    fontWeight: '500',
  },
  submitButton: {
    height: 62,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#D70015',
    shadowOpacity: 0.24,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  submitButtonPressed: {
    transform: [{ scale: 0.985 }],
  },
  submitButtonText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
});