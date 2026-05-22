import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ActionProofCaptureCard from '../action/ActionProofCaptureCard';
import ActionProofCommentBox from '../action/ActionProofCommentBox';
import type { ClubsThemeColors } from '../../constants/clubsTheme';
import { useClubDareProofResponse } from '../../hooks/useClubDareProofResponse';
import type { ActionChallenge } from '../../types/action';
import type {
  ClubFeedItemApi,
  ClubPromptResponseApi,
  CreateClubPromptResponsePayloadApi,
} from '../../types/clubsApi';

type Props = {
  visible: boolean;
  prompt: ClubFeedItemApi | null;
  colors: ClubsThemeColors;
  submitResponse: (
    payload: CreateClubPromptResponsePayloadApi,
  ) => Promise<ClubPromptResponseApi | null>;
  onClose: () => void;
  onSubmitted: () => void;
};

function getDateLabel(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function makeChallenge(prompt: ClubFeedItemApi | null): ActionChallenge {
  return {
    id: prompt?.id ?? 'club-prompt-unavailable',
    type: 'dare',
    title: prompt?.content ?? 'Desafio indisponivel',
    description: 'Envie uma prova em video, audio ou arquivo para este desafio.',
    creatorName: prompt?.authorName ?? 'Autor nao informado',
    creatorInitials:
      prompt?.authorName
        ?.trim()
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || '??',
    createdAtLabel: getDateLabel(prompt?.publishedAt ?? prompt?.createdAt ?? null) ?? '',
    participants: [],
    status: prompt?.viewerState.answeredByMe ? 'submitted' : 'active',
    attemptsUsed: prompt?.viewerState.answeredByMe ? 1 : 0,
    maxAttempts: prompt?.maxAttempts,
    expiresAtLabel: getDateLabel(prompt?.expiresAt ?? null),
    timeRemainingLabel: null,
    completedAt: null,
    proofRequired: true,
    proofCtaLabel: 'Adicionar prova',
    primaryActionLabel: 'Enviar prova',
    secondaryActionLabel: 'Visualizar prova',
    existingProofCount: 0,
    draftProof: null,
  };
}

export default function ClubDareProofModal({
  visible,
  prompt,
  colors,
  submitResponse,
  onClose,
  onSubmitted,
}: Props) {
  const challenge = React.useMemo(() => makeChallenge(prompt), [prompt]);
  const {
    draftProof,
    proofText,
    canSubmit,
    isSubmitting,
    errorMessage,
    handleCaptureProof,
    handleUpdateProofText,
    handleRemoveDraftProof,
    handleSubmitProof,
    reset,
  } = useClubDareProofResponse({
    prompt,
    submitResponse,
  });

  React.useEffect(() => {
    if (!visible) {
      reset();
    }
  }, [reset, visible]);

  async function handleSubmit() {
    try {
      await handleSubmitProof();
      reset();
      onSubmitted();
    } catch {
      return;
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          testID="club-dare-proof-modal"
          style={[
            styles.card,
            {
              backgroundColor: colors.background,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: colors.redSoft }]}>
              <MaterialIcons name="bolt" size={24} color={colors.red} />
            </View>

            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>
                Enviar prova
              </Text>
              <Text
                numberOfLines={3}
                style={[styles.promptText, { color: colors.subText }]}
              >
                {prompt?.content ?? 'Prompt indisponivel.'}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ActionProofCaptureCard
              challenge={{
                ...challenge,
                draftProof,
              }}
              draftProof={draftProof}
              backgroundColor={colors.surface}
              borderColor={colors.cardBorder}
              overlayColor={colors.surfaceSoft}
              tintColor={colors.redSoft}
              titleColor={colors.text}
              descriptionColor={colors.subText}
              mutedTextColor={colors.muted}
              accentColor={colors.green}
              accentTextColor={colors.white}
              secondaryBackgroundColor={colors.surfaceStrong}
              secondaryTextColor={colors.text}
              dangerColor={colors.red}
              onPressRecordVideo={handleCaptureProof}
              onPressRecordAudio={handleCaptureProof}
              onPressPickFile={handleCaptureProof}
              onPressRemoveDraft={handleRemoveDraftProof}
            />

            <ActionProofCommentBox
              value={proofText}
              backgroundColor={colors.surface}
              borderColor={colors.cardBorder}
              titleColor={colors.text}
              descriptionColor={colors.subText}
              mutedTextColor={colors.muted}
              inputBackgroundColor={colors.surfaceSoft}
              inputTextColor={colors.text}
              placeholderTextColor={colors.muted}
              accentColor={colors.green}
              helperText="Esse texto sera enviado junto com a prova do desafio."
              onChangeText={handleUpdateProofText}
            />

            {errorMessage ? (
              <Text
                testID="club-dare-proof-error"
                style={[styles.errorText, { color: colors.red }]}
              >
                {errorMessage}
              </Text>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onClose}
              style={({ pressed }) => [
                styles.secondaryButton,
                { backgroundColor: colors.surfaceStrong },
                pressed && !isSubmitting && styles.pressed,
              ]}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                Cancelar
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit }}
              disabled={!canSubmit}
              testID="club-dare-proof-submit"
              onPress={() => {
                void handleSubmit();
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: canSubmit ? colors.green : colors.surfaceStrong,
                },
                pressed && canSubmit && styles.pressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <MaterialIcons name="cloud-upload" size={17} color={colors.white} />
              )}
              <Text style={[styles.primaryButtonText, { color: colors.white }]}>
                Enviar
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.66)',
    justifyContent: 'center',
    padding: 14,
  },
  card: {
    maxHeight: '92%',
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 2,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 5,
  },
  title: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '900',
  },
  promptText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  scroll: {
    maxHeight: 560,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 2,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
  },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.88,
  },
});
