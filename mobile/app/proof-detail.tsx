import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ProofMediaViewer from '../components/proof-detail/ProofMediaViewer';
import {
  DARK_PROOF_DETAIL_COLORS,
  LIGHT_PROOF_DETAIL_COLORS,
} from '../constants/proofDetailTheme';
import { useTheme } from '../context/ThemeContext';
import { useProofDetailScreen } from '../hooks/useProofDetailScreen';

type ProofDetailRouteParams = {
  proofId?: string | string[];
  dareId?: string | string[];
  title?: string | string[];
  challenger?: string | string[];
  mediaType?: string | string[];
  localUri?: string | string[];
  fileName?: string | string[];
  durationSeconds?: string | string[];
  text?: string | string[];
  source?: string | string[];
};

function getMediaTypeLabel(mediaType: string) {
  if (mediaType === 'image') {
    return 'Imagem';
  }

  if (mediaType === 'video') {
    return 'Video';
  }

  if (mediaType === 'audio') {
    return 'Audio';
  }

  return 'Arquivo';
}

export default function ProofDetailScreen() {
  const params = useLocalSearchParams<ProofDetailRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const [openErrorMessage, setOpenErrorMessage] = React.useState<string | null>(
    null,
  );

  const colors = isDark
    ? DARK_PROOF_DETAIL_COLORS
    : LIGHT_PROOF_DETAIL_COLORS;
  const { proof, state, contentState, errorMessage, handleRetry } =
    useProofDetailScreen(params);

  async function handleOpenMedia() {
    const mediaUri = proof.mediaUri?.trim();

    if (!mediaUri) {
      setOpenErrorMessage('Midia indisponivel para abrir.');
      return;
    }

    try {
      setOpenErrorMessage(null);
      await Linking.openURL(mediaUri);
    } catch {
      setOpenErrorMessage('Nao foi possivel abrir esta midia no dispositivo.');
    }
  }

  const isLoading = contentState === 'loading';
  const isError =
    contentState === 'error' ||
    contentState === 'access-denied' ||
    contentState === 'not-found';
  const statusTitle =
    contentState === 'local-draft' ? 'Rascunho local' : 'Prova carregada';
  const statusDescription =
    contentState === 'local-draft'
      ? 'Esta tela mostra a midia que ainda esta no celular.'
      : 'Dados da prova carregados a partir do backend.';

  return (
    <View style={[styles.root, { backgroundColor: colors.headerBackground }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.headerBackground}
      />

      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.headerBackground,
              paddingTop: Math.max(insets.top, 12),
              borderBottomColor: isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(255,255,255,0.12)',
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [
              styles.headerIconButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.headerIcon} />
          </Pressable>

          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerEyebrow, { color: colors.headerText }]}>
              VISUALIZAR PROVA
            </Text>
            <Text style={[styles.headerTitle, { color: colors.headerText }]}>
              {contentState === 'local-draft' ? 'Rascunho' : 'Backend'}
            </Text>
          </View>

          <View style={styles.headerIconButton} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: 32 + Math.max(insets.bottom, 0),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introSection}>
            <Text style={[styles.eyebrow, { color: colors.textMuted }]}>
              PROVA DO DESAFIO
            </Text>

            <Text style={[styles.title, { color: colors.text }]}>
              {proof.relatedChallenge.title}
            </Text>

            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Criado por {proof.author.name}
            </Text>
          </View>

          {isLoading ? (
            <View
              style={[
                styles.statusCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSoft,
                },
              ]}
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                Carregando prova...
              </Text>
            </View>
          ) : null}

          {isError ? (
            <View
              style={[
                styles.stateCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSoft,
                },
              ]}
            >
              <View
                style={[
                  styles.statusIcon,
                  {
                    backgroundColor: isDark
                      ? 'rgba(225,29,46,0.18)'
                      : 'rgba(215,0,21,0.10)',
                  },
                ]}
              >
                <MaterialIcons
                  name={
                    contentState === 'access-denied'
                      ? 'lock-outline'
                      : 'error-outline'
                  }
                  size={22}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                Nao foi possivel abrir a prova
              </Text>
              <Text style={[styles.statusDescription, { color: colors.textMuted }]}>
                {errorMessage}
              </Text>
              <Pressable
                onPress={() => {
                  void handleRetry();
                }}
                style={({ pressed }) => [
                  styles.retryButton,
                  { backgroundColor: colors.primary },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.retryButtonText, { color: '#ffffff' }]}>
                  Tentar novamente
                </Text>
              </Pressable>
            </View>
          ) : null}

          {!isLoading && !isError ? (
            <>
              <View
                style={[
                  styles.statusCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSoft,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusIcon,
                    {
                      backgroundColor: isDark
                        ? 'rgba(225,29,46,0.18)'
                        : 'rgba(215,0,21,0.10)',
                    },
                  ]}
                >
                  <MaterialIcons
                    name={
                      contentState === 'local-draft'
                        ? 'phone-android'
                        : 'cloud-done'
                    }
                    size={22}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.statusTextWrap}>
                  <Text style={[styles.statusTitle, { color: colors.text }]}>
                    {statusTitle}
                  </Text>

                  <Text
                    style={[styles.statusDescription, { color: colors.textMuted }]}
                  >
                    {statusDescription}
                  </Text>
                </View>
              </View>

              {state.isFromCache || state.syncErrorMessage ? (
                <View
                  style={[
                    styles.cacheNotice,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.borderSoft,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="info-outline"
                    size={17}
                    color={colors.textMuted}
                  />
                  <Text style={[styles.cacheNoticeText, { color: colors.textMuted }]}>
                    {state.syncErrorMessage ?? 'Dados salvos neste dispositivo'}
                  </Text>
                </View>
              ) : null}

              <ProofMediaViewer
                proof={proof}
                backgroundColor={colors.surface}
                overlayColor={colors.mediaBackground}
                borderColor={colors.borderSoft}
                titleColor={colors.text}
                metaColor={colors.textMuted}
                accentColor={colors.primary}
                accentTextColor="#ffffff"
                onPressOpenMedia={handleOpenMedia}
              />

              {openErrorMessage ? (
                <Text style={[styles.feedbackText, { color: colors.primary }]}>
                  {openErrorMessage}
                </Text>
              ) : null}

              <View
                style={[
                  styles.mediaInfoStack,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSoft,
                  },
                ]}
              >
                <InfoRow
                  label="Tipo"
                  value={getMediaTypeLabel(proof.mediaType)}
                  labelColor={colors.textSoft}
                  valueColor={colors.text}
                />
                <InfoRow
                  label="Autor"
                  value={proof.author.name}
                  labelColor={colors.textSoft}
                  valueColor={colors.text}
                />
                <InfoRow
                  label="Criado em"
                  value={proof.createdAtLabel}
                  labelColor={colors.textSoft}
                  valueColor={colors.text}
                />
                <InfoRow
                  label="Dare ID"
                  value={proof.challengeId}
                  labelColor={colors.textSoft}
                  valueColor={colors.text}
                />
                <InfoRow
                  label="Proof ID"
                  value={proof.id}
                  labelColor={colors.textSoft}
                  valueColor={colors.text}
                />
              </View>

              <View
                style={[
                  styles.textCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSoft,
                  },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Texto da prova
                </Text>

                <Text style={[styles.proofText, { color: colors.textMuted }]}>
                  {proof.description}
                </Text>
              </View>
            </>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
  labelColor: string;
  valueColor: string;
};

function InfoRow({ label, value, labelColor, valueColor }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: labelColor }]}>{label}</Text>
      <Text numberOfLines={2} style={[styles.infoValue, { color: valueColor }]}>
        {value || 'Nao informado'}
      </Text>
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
    minHeight: 92,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  headerTitle: {
    marginTop: 2,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 16,
  },
  introSection: {
    gap: 6,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextWrap: {
    flex: 1,
    gap: 4,
  },
  statusTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
  },
  statusDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  stateCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    gap: 12,
  },
  retryButton: {
    minHeight: 42,
    borderRadius: 999,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  cacheNotice: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cacheNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  mediaInfoStack: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },
  textCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  proofText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
});
