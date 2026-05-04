import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActionHeader from '../components/action/ActionHeader';
import ActionChallengeCard from '../components/action/ActionChallengeCard';
import ActionMeta from '../components/action/ActionMeta';
import ActionProofCaptureCard from '../components/action/ActionProofCaptureCard';
import ActionFooter from '../components/action/ActionFooter';
import ActionProofCommentBox from '../components/action/ActionProofCommentBox';
import ActionCancelConfirmModal from '../components/action/ActionCancelConfirmModal';

import { useActionScreen } from '../hooks/useActionScreen';
import { useTheme } from '../context/ThemeContext';
import {
  DARK_ACTION_SCREEN_COLORS,
  LIGHT_ACTION_SCREEN_COLORS,
} from '../constants/actionScreenTheme';
import type { ActionScreenParams } from '../types/action';

export default function ActionScreen() {
  const params = useLocalSearchParams<ActionScreenParams>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark } = useTheme();

  const colors = isDark
    ? DARK_ACTION_SCREEN_COLORS
    : LIGHT_ACTION_SCREEN_COLORS;

    const {
    challenge,
    state,
    isSubmittingProof,
    submitProofError,
    submitProofSuccessMessage,
    handleCaptureProof,
    handleUpdateProofText,
    handleRemoveDraftProof,
    handleSubmitProof,
  } = useActionScreen(params);

  const [isCancelModalVisible, setIsCancelModalVisible] = React.useState(false);

  const accentColor = colors.dareAccent;
  const accentSoftColor = colors.dareSoft;

  function handleOpenProofDetail() {
    router.push({
      pathname: '/proof-detail-screen',
      params: {
        proofId: challenge.draftProof?.id ?? 'proof-draft-local',
        dareId: challenge.id,
        title: challenge.title,
        challenger: challenge.creatorName,
        mediaType: challenge.draftProof?.mediaType ?? '',
        text: challenge.draftProof?.text ?? '',
      },
    });
  }

    async function handleSubmitAndOpenProof() {
    try {
      await handleSubmitProof();
      handleOpenProofDetail();
    } catch {
      // O erro já é tratado pelo hook e exibido na tela.
    }
  }

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
              styles.blurTopLeft,
              {
                backgroundColor: colors.dareAccent,
                opacity: isDark ? 0.1 : 0.08,
              },
            ]}
          />
          <View
            style={[
              styles.blurBlob,
              styles.blurTopRight,
              {
                backgroundColor: colors.dareAccent,
                opacity: isDark ? 0.12 : 0.08,
              },
            ]}
          />
          <View
            style={[
              styles.blurBlob,
              styles.blurBottom,
              {
                backgroundColor: colors.primary,
                opacity: isDark ? 0.08 : 0.05,
              },
            ]}
          />
        </View>

        <ActionHeader
          challengeType="dare"
          backgroundColor={colors.headerBackground}
          titleColor={colors.headerText}
          iconColor={colors.headerIcon}
          borderBottomColor={
            isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)'
          }
          onPressCancel={() => setIsCancelModalVisible(true)}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: 120 + Math.max(insets.bottom, 0),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introSection}>
            <Text style={[styles.eyebrow, { color: colors.textMuted }]}>
              FAZER PROVA
            </Text>

            <Text style={[styles.screenTitle, { color: colors.text }]}>
              Sua prova começa aqui
            </Text>

            <Text style={[styles.screenSubtitle, { color: colors.textMuted }]}>
              Revise o desafio, acompanhe o status e envie uma prova em vídeo ou
              áudio. O texto é opcional.
            </Text>
          </View>

          <View style={styles.contentStack}>
            <ActionChallengeCard
              challenge={challenge}
              backgroundColor={colors.surface}
              borderColor={colors.borderSoft}
              titleColor={colors.text}
              descriptionColor={colors.textMuted}
              mutedTextColor={colors.textSoft}
              badgeBackgroundColor={accentSoftColor}
              badgeTextColor={accentColor}
              accentColor={accentColor}
              participantBackgroundColor={colors.surfaceSoft}
              participantTextColor={colors.primaryText}
              extraParticipantBackgroundColor={accentSoftColor}
              extraParticipantTextColor={accentColor}
            />

            <ActionMeta
              challenge={challenge}
              progressValue={state.progressValue}
              backgroundColor={colors.surface}
              borderColor={colors.borderSoft}
              labelColor={colors.textSoft}
              valueColor={colors.text}
              accentColor={accentColor}
              trackColor={colors.surfaceAlt}
              successColor={colors.success}
              warningColor={colors.warning}
              dangerColor={colors.danger}
            />

            <ActionProofCaptureCard
              challenge={challenge}
              draftProof={challenge.draftProof}
              backgroundColor={colors.surface}
              borderColor={colors.borderSoft}
              overlayColor={colors.mediaOverlay}
              tintColor={colors.mediaTint}
              titleColor={colors.text}
              descriptionColor={colors.textMuted}
              mutedTextColor={colors.textSoft}
              accentColor={accentColor}
              accentTextColor={colors.primaryText}
              secondaryBackgroundColor={colors.surfaceSoft}
              secondaryTextColor={colors.text}
              dangerColor={colors.danger}
              onPressRecordVideo={handleCaptureProof}
              onPressRecordAudio={handleCaptureProof}
              onPressPickFile={handleCaptureProof}
              onPressPreview={handleOpenProofDetail}
              onPressRemoveDraft={handleRemoveDraftProof}
            />

            <ActionProofCommentBox
              value={challenge.draftProof?.text ?? ''}
              backgroundColor={colors.surface}
              borderColor={colors.borderSoft}
              titleColor={colors.text}
              descriptionColor={colors.textMuted}
              mutedTextColor={colors.textSoft}
              inputBackgroundColor={colors.surfaceSoft}
              inputTextColor={colors.text}
              placeholderTextColor={colors.textSoft}
              accentColor={accentColor}
              onChangeText={handleUpdateProofText}
            />

            {submitProofError ? (
              <Text style={[styles.feedbackText, { color: colors.danger }]}>
                {submitProofError}
              </Text>
            ) : null}

            {submitProofSuccessMessage ? (
              <Text style={[styles.feedbackText, { color: colors.success }]}>
                {submitProofSuccessMessage}
              </Text>
            ) : null}
          </View>
        </ScrollView>

        <ActionFooter
          primaryLabel={
            isSubmittingProof ? 'Enviando prova...' : challenge.primaryActionLabel
          }
          secondaryLabel={
            state.canOpenProofPreview ? challenge.secondaryActionLabel : undefined
          }
          primaryDisabled={!state.canSubmitProof || isSubmittingProof}
          secondaryDisabled={!state.canOpenProofPreview}
          backgroundColor={colors.background}
          borderTopColor={colors.border}
          primaryBackgroundColor={colors.primary}
          primaryTextColor={colors.primaryText}
          secondaryBackgroundColor={colors.surfaceAlt}
          secondaryTextColor={colors.text}
          bottomInset={insets.bottom}
          onPressPrimary={handleSubmitAndOpenProof}
          onPressSecondary={handleOpenProofDetail}
        />

             <ActionCancelConfirmModal
              visible={isCancelModalVisible}
              titleColor={colors.text}
              descriptionColor={colors.textMuted}
              backgroundColor={colors.surface}
              overlayColor="rgba(0,0,0,0.6)"
              primaryColor={colors.danger}
              primaryTextColor="#fff"
              secondaryColor={colors.surfaceSoft}
              secondaryTextColor={colors.text}
              onCancel={() => setIsCancelModalVisible(false)}
              onConfirmExit={() => {
                setIsCancelModalVisible(false);
                router.back();
              }}
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
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blurBlob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blurTopLeft: {
    width: 240,
    height: 240,
    top: -90,
    left: -80,
  },
  blurTopRight: {
    width: 220,
    height: 220,
    top: 160,
    right: -90,
  },
  blurBottom: {
    width: 320,
    height: 320,
    bottom: -140,
    left: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  introSection: {
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  screenTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -1.1,
  },
  screenSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    maxWidth: 320,
  },
  contentStack: {
    gap: 16,
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
});