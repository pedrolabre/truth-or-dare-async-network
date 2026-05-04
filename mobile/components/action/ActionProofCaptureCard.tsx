import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ActionChallenge, ActionProofDraft } from '../../types/action';

type ActionProofCaptureCardProps = {
  challenge: ActionChallenge;
  draftProof?: ActionProofDraft | null;
  backgroundColor: string;
  borderColor: string;
  overlayColor: string;
  tintColor: string;
  titleColor: string;
  descriptionColor: string;
  mutedTextColor: string;
  accentColor: string;
  accentTextColor: string;
  secondaryBackgroundColor: string;
  secondaryTextColor: string;
  dangerColor: string;
  onPressRecordVideo: () => void;
  onPressRecordAudio: () => void;
  onPressPickFile: () => void;
  onPressPreview?: () => void;
  onPressRemoveDraft?: () => void;
};

function formatDuration(durationSeconds?: number | null) {
  if (!durationSeconds || durationSeconds <= 0) {
    return '00:00';
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function ActionProofCaptureCard({
  challenge,
  draftProof,
  backgroundColor,
  borderColor,
  overlayColor,
  tintColor,
  titleColor,
  descriptionColor,
  mutedTextColor,
  accentColor,
  accentTextColor,
  secondaryBackgroundColor,
  secondaryTextColor,
  dangerColor,
  onPressRecordVideo,
  onPressRecordAudio,
  onPressPickFile,
  onPressPreview,
  onPressRemoveDraft,
}: ActionProofCaptureCardProps) {
  const hasDraft = !!draftProof;
  const isVideo = draftProof?.mediaType === 'video';
  const isAudio = draftProof?.mediaType === 'audio';

  const draftIconName = isVideo ? 'videocam' : isAudio ? 'mic' : 'insert-drive-file';

  const draftLabel = isVideo
    ? `Vídeo em rascunho · ${formatDuration(draftProof?.durationSeconds)}`
    : isAudio
      ? `Áudio em rascunho · ${formatDuration(draftProof?.durationSeconds)}`
      : 'Arquivo em rascunho';

  const draftTitle =
    draftProof?.fileName ??
    (isVideo
      ? 'Vídeo pronto para revisão'
      : isAudio
        ? 'Áudio pronto para revisão'
        : 'Arquivo pronto para revisão');

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.title, { color: titleColor }]}>Prova</Text>
          <Text style={[styles.description, { color: descriptionColor }]}>
            {hasDraft
              ? 'Você já possui uma prova em rascunho pronta para revisar ou enviar.'
              : challenge.type === 'truth'
                ? 'Grave uma resposta em vídeo ou áudio, ou escolha um arquivo do celular.'
                : 'Registre sua prova em vídeo, áudio ou envie um arquivo do celular.'}
          </Text>
        </View>

        <View
          style={[
            styles.typeBadge,
            {
              backgroundColor: tintColor,
            },
          ]}
        >
          <Text style={[styles.typeBadgeText, { color: titleColor }]}>
            {challenge.proofRequired ? 'Obrigatória' : 'Opcional'}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.previewArea,
          {
            backgroundColor: overlayColor,
            borderColor,
          },
        ]}
      >
        <View
          style={[
            styles.previewGlow,
            {
              backgroundColor: tintColor,
            },
          ]}
        />

        <View style={styles.previewInner}>
          {hasDraft ? (
            <>
              <View style={[styles.previewIconWrap, { backgroundColor: accentColor }]}>
                <MaterialIcons name={draftIconName} size={28} color={accentTextColor} />
              </View>

              <Text style={[styles.previewTitle, { color: titleColor }]}>
                {draftTitle}
              </Text>

              <Text style={[styles.previewMeta, { color: mutedTextColor }]}>
                {draftLabel}
              </Text>

              <View style={styles.previewInfoRow}>
                <View style={styles.previewInfoChip}>
                  <MaterialIcons
                    name="check-circle-outline"
                    size={15}
                    color={accentColor}
                  />
                  <Text style={[styles.previewInfoText, { color: mutedTextColor }]}>
                    pronto para enviar
                  </Text>
                </View>

                <View style={styles.previewInfoChip}>
                  <MaterialIcons name="visibility" size={15} color={accentColor} />
                  <Text style={[styles.previewInfoText, { color: mutedTextColor }]}>
                    revisão local
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.emptyIconWrap, { borderColor: tintColor }]}>
                <MaterialIcons name="add-a-photo" size={34} color={titleColor} />
              </View>

              <Text style={[styles.emptyTitle, { color: titleColor }]}>
                Nenhuma prova adicionada
              </Text>

              <Text style={[styles.emptyDescription, { color: mutedTextColor }]}>
                Escolha como deseja registrar sua prova para este desafio.
              </Text>
            </>
          )}
        </View>

        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />
      </View>

      <View style={styles.actions}>
        <View style={styles.captureGrid}>
          <Pressable
            onPress={onPressRecordVideo}
            style={({ pressed }) => [
              styles.captureButton,
              { backgroundColor: accentColor },
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name="videocam" size={20} color={accentTextColor} />
            <Text style={[styles.captureButtonText, { color: accentTextColor }]}>
              {hasDraft ? 'Gravar novo vídeo' : 'Gravar vídeo'}
            </Text>
          </Pressable>

          <Pressable
            onPress={onPressRecordAudio}
            style={({ pressed }) => [
              styles.captureButton,
              { backgroundColor: secondaryBackgroundColor },
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name="mic" size={20} color={secondaryTextColor} />
            <Text style={[styles.captureButtonText, { color: secondaryTextColor }]}>
              {hasDraft ? 'Gravar novo áudio' : 'Gravar áudio'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={onPressPickFile}
          style={({ pressed }) => [
            styles.fileButton,
            { backgroundColor: secondaryBackgroundColor },
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name="upload-file" size={20} color={secondaryTextColor} />
          <Text style={[styles.fileButtonText, { color: secondaryTextColor }]}>
            {hasDraft ? 'Escolher outro arquivo' : 'Escolher arquivo do celular'}
          </Text>
        </Pressable>

        {hasDraft ? (
          <View style={styles.secondaryActions}>
            <Pressable
              onPress={onPressPreview}
              style={({ pressed }) => [
                styles.secondaryButton,
                { backgroundColor: secondaryBackgroundColor },
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons name="play-circle-outline" size={18} color={secondaryTextColor} />
              <Text style={[styles.secondaryButtonText, { color: secondaryTextColor }]}>
                Visualizar
              </Text>
            </Pressable>

            <Pressable
              onPress={onPressRemoveDraft}
              style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}
            >
              <MaterialIcons name="delete-outline" size={18} color={dangerColor} />
              <Text style={[styles.ghostButtonText, { color: dangerColor }]}>
                Remover
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  header: {
    gap: 12,
  },
  headerTextWrap: {
    gap: 8,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  previewArea: {
    minHeight: 280,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  previewGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.25,
  },
  previewInner: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  previewIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  previewMeta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  previewInfoRow: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  previewInfoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewInfoText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 280,
  },
  actions: {
    gap: 12,
  },
  captureGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  captureButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  captureButtonText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  fileButton: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fileButtonText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  ghostButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ghostButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 18,
    height: 18,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 18,
    height: 18,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 18,
    height: 18,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 18,
    height: 18,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
});