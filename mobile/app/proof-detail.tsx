import React from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ProofDetailHeader from '../components/proof-detail/ProofDetailHeader';
import ProofMediaViewer from '../components/proof-detail/ProofMediaViewer';
import ProofDetailContent from '../components/proof-detail/ProofDetailContent';
import ProofActions from '../components/proof-detail/ProofActions';

import { useProofDetailScreen } from '../hooks/useProofDetailScreen';
import { useTheme } from '../context/ThemeContext';
import {
  DARK_PROOF_DETAIL_COLORS,
  LIGHT_PROOF_DETAIL_COLORS,
} from '../constants/proofDetailTheme';
import type { ProofDetailParams } from '../types/proof';

export default function ProofDetailScreen() {
  const params = useLocalSearchParams<ProofDetailParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const colors = isDark
    ? DARK_PROOF_DETAIL_COLORS
    : LIGHT_PROOF_DETAIL_COLORS;

  const {
    proof,
    state,
    handleToggleLike,
    handleDeleteProof,
    handlePostProof,
  } = useProofDetailScreen({
    proofId: params.proofId,
  });

  const accentColor =
    proof.challengeType === 'truth'
      ? '#5A8363'
      : proof.challengeType === 'club'
        ? '#5A8363'
        : colors.primary;

  const accentSoftColor =
    proof.challengeType === 'truth' || proof.challengeType === 'club'
      ? 'rgba(90,131,99,0.12)'
      : isDark
        ? 'rgba(225,29,46,0.18)'
        : 'rgba(215,0,21,0.10)';

  function handleOpenMenu() {
    if (!state.canDelete) {
      Alert.alert('Opções', 'Mais ações serão adicionadas em breve.');
      return;
    }

    Alert.alert(
      'Opções da prova',
      'Escolha uma ação para esta prova.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir prova',
          style: 'destructive',
          onPress: handleDeleteProof,
        },
      ],
      { cancelable: true },
    );
  }

  function handleComment() {
    Alert.alert(
      'Comentários',
      'A integração de comentários desta prova será conectada depois.',
    );
  }

  function handlePlay() {
    Alert.alert(
      'Preview',
      'O player real de vídeo/imagem será integrado depois.',
    );
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

        <ProofDetailHeader
          backgroundColor={colors.headerBackground}
          titleColor={colors.headerText}
          iconColor={colors.headerIcon}
          borderBottomColor={
            isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)'
          }
          onPressBack={() => router.back()}
          onPressMenu={handleOpenMenu}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: 110 + Math.max(insets.bottom, 0),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentStack}>
            <ProofMediaViewer
              proof={proof}
              backgroundColor={colors.surface}
              overlayColor={colors.mediaBackground}
              borderColor={colors.borderSoft}
              titleColor={colors.text}
              metaColor={colors.textMuted}
              accentColor={accentColor}
              accentTextColor="#ffffff"
              onPressPlay={handlePlay}
            />

            <ProofDetailContent
              proof={proof}
              backgroundColor={colors.surface}
              borderColor={colors.borderSoft}
              titleColor={colors.text}
              descriptionColor={colors.textMuted}
              metaColor={colors.textSoft}
              accentColor={accentColor}
              accentSoftColor={accentSoftColor}
            />
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <ProofActions
            likedByMe={proof.likedByMe}
            likeColor={colors.like}
            commentColor={colors.comment}
            primaryColor={colors.primary}
            primaryTextColor={colors.primaryText}
            borderColor="transparent"
            primaryActionLabel={state.primaryActionLabel}
            onToggleLike={handleToggleLike}
            onComment={handleComment}
            onPrimaryAction={handlePostProof}
          />
        </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  contentStack: {
    gap: 16,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});