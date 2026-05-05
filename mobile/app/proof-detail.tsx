import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../context/ThemeContext';
import {
  DARK_PROOF_DETAIL_COLORS,
  LIGHT_PROOF_DETAIL_COLORS,
} from '../constants/proofDetailTheme';

type LocalProofMediaType = 'video' | 'audio' | 'file';

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

function getParamValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getMediaType(value?: string | string[]): LocalProofMediaType {
  const mediaType = getParamValue(value);

  if (mediaType === 'video' || mediaType === 'audio' || mediaType === 'file') {
    return mediaType;
  }

  return 'file';
}

function formatDuration(value?: string | string[]) {
  const rawValue = getParamValue(value);
  const durationSeconds = rawValue ? Number(rawValue) : 0;

  if (!durationSeconds || Number.isNaN(durationSeconds) || durationSeconds <= 0) {
    return 'Duração não informada';
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function isImageFile(fileName?: string | null, localUri?: string | null) {
  const source = `${fileName ?? ''} ${localUri ?? ''}`.toLowerCase();

  return (
    source.includes('.jpg') ||
    source.includes('.jpeg') ||
    source.includes('.png') ||
    source.includes('.webp')
  );
}

function getMediaLabel(mediaType: LocalProofMediaType) {
  if (mediaType === 'video') {
    return 'Vídeo em rascunho';
  }

  if (mediaType === 'audio') {
    return 'Áudio em rascunho';
  }

  return 'Arquivo em rascunho';
}

function getMediaIcon(mediaType: LocalProofMediaType) {
  if (mediaType === 'video') {
    return 'videocam';
  }

  if (mediaType === 'audio') {
    return 'mic';
  }

  return 'insert-drive-file';
}

function getMediaDescription(mediaType: LocalProofMediaType) {
  if (mediaType === 'video') {
    return 'Vídeo selecionado localmente. O player real pode ser conectado depois, sem depender de Storage agora.';
  }

  if (mediaType === 'audio') {
    return 'Áudio gravado ou selecionado localmente. A tela já está preparada para o fluxo de rascunho.';
  }

  return 'Arquivo selecionado localmente. A tela não tenta abrir o arquivo para evitar comportamento quebrado.';
}

export default function ProofDetailScreen() {
  const params = useLocalSearchParams<ProofDetailRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const colors = isDark
    ? DARK_PROOF_DETAIL_COLORS
    : LIGHT_PROOF_DETAIL_COLORS;

  const mediaType = getMediaType(params.mediaType);
  const localUri = getParamValue(params.localUri) ?? null;
  const fileName = getParamValue(params.fileName) ?? null;
  const title = getParamValue(params.title) ?? 'Desafio';
  const challenger = getParamValue(params.challenger) ?? 'Autor não informado';
  const text = getParamValue(params.text) ?? '';
  const dareId = getParamValue(params.dareId) ?? '';
  const proofId = getParamValue(params.proofId) ?? 'proof-draft-local';
  const durationLabel = formatDuration(params.durationSeconds);
  const isLocalDraft = getParamValue(params.source) === 'local-draft';

  const shouldShowImagePreview =
    mediaType === 'file' && !!localUri && isImageFile(fileName, localUri);

  const accentColor = colors.primary;
  const accentSoftColor = isDark
    ? 'rgba(225,29,46,0.18)'
    : 'rgba(215,0,21,0.10)';

  return (
    <View style={[styles.root, { backgroundColor: colors.headerBackground }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.headerBackground}
      />

      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View pointerEvents="none" style={styles.backgroundLayer}>
          <View
            style={[
              styles.blurBlob,
              styles.blurTop,
              { backgroundColor: accentColor, opacity: isDark ? 0.12 : 0.08 },
            ]}
          />
          <View
            style={[
              styles.blurBlob,
              styles.blurRight,
              { backgroundColor: colors.comment, opacity: isDark ? 0.1 : 0.06 },
            ]}
          />
          <View
            style={[
              styles.blurBlob,
              styles.blurBottom,
              { backgroundColor: colors.like, opacity: isDark ? 0.08 : 0.05 },
            ]}
          />
        </View>

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
              Rascunho local
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

            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Criado por {challenger}
            </Text>
          </View>

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
                  backgroundColor: accentSoftColor,
                },
              ]}
            >
              <MaterialIcons
                name={isLocalDraft ? 'phone-android' : 'cloud-done'}
                size={22}
                color={accentColor}
              />
            </View>

            <View style={styles.statusTextWrap}>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                {isLocalDraft
                  ? 'Prova local ainda não enviada'
                  : 'Prova carregada'}
              </Text>

              <Text style={[styles.statusDescription, { color: colors.textMuted }]}>
                {isLocalDraft
                  ? 'Esta tela mostra a mídia que está no celular. Ela ainda não foi enviada para Storage nem salva como proof final no backend.'
                  : 'Esta prova possui dados carregados para visualização.'}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.mediaCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSoft,
              },
            ]}
          >
            <View
              style={[
                styles.mediaPreview,
                {
                  backgroundColor: colors.mediaBackground,
                  borderColor: colors.borderSoft,
                },
              ]}
            >
              {shouldShowImagePreview ? (
                <Image source={{ uri: localUri }} style={styles.imagePreview} />
              ) : (
                <View style={styles.mediaFallback}>
                  <View
                    style={[
                      styles.mediaIconWrap,
                      {
                        backgroundColor: accentColor,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={getMediaIcon(mediaType)}
                      size={34}
                      color="#ffffff"
                    />
                  </View>

                  <Text style={[styles.mediaTitle, { color: colors.text }]}>
                    {getMediaLabel(mediaType)}
                  </Text>

                  <Text style={[styles.mediaDescription, { color: colors.textMuted }]}>
                    {getMediaDescription(mediaType)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.mediaInfoStack}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSoft }]}>
                  Tipo
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {getMediaLabel(mediaType)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSoft }]}>
                  Arquivo
                </Text>
                <Text
                  numberOfLines={2}
                  style={[styles.infoValue, { color: colors.text }]}
                >
                  {fileName || 'Nome não informado'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSoft }]}>
                  Duração
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {mediaType === 'file' ? 'Não se aplica' : durationLabel}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSoft }]}>
                  Dare ID
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.infoValue, { color: colors.text }]}
                >
                  {dareId || 'Não informado'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSoft }]}>
                  Proof ID
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.infoValue, { color: colors.text }]}
                >
                  {proofId}
                </Text>
              </View>
            </View>
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
              {text.trim()
                ? text.trim()
                : 'Nenhum texto foi adicionado. O comentário da prova é opcional.'}
            </Text>
          </View>
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
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blurBlob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blurTop: {
    width: 260,
    height: 260,
    top: -100,
    left: -80,
  },
  blurRight: {
    width: 220,
    height: 220,
    top: 220,
    right: -100,
  },
  blurBottom: {
    width: 320,
    height: 320,
    bottom: -150,
    left: 30,
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
    letterSpacing: -1,
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
  mediaCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 16,
  },
  mediaPreview: {
    minHeight: 230,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 230,
    resizeMode: 'cover',
  },
  mediaFallback: {
    minHeight: 230,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mediaIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  mediaDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 270,
  },
  mediaInfoStack: {
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
  pressed: {
    opacity: 0.72,
  },
});