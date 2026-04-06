import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {
  FeedCommentsColors,
  FeedCommentsReportReason,
  FeedCommentsReportStep,
} from '../../types/comments';

type FeedCommentsReportModalProps = {
  visible: boolean;
  colors: FeedCommentsColors;
  step: FeedCommentsReportStep;
  selectedReason: FeedCommentsReportReason | null;
  onClose: () => void;
  onSelectReason: (reason: FeedCommentsReportReason) => void;
  onBack: () => void;
  onSubmit: () => void;
  onFinish: () => void;
};

const REPORT_REASONS: FeedCommentsReportReason[] = [
  'Spam ou fraude',
  'Discurso de ódio ou ofensa',
  'Conteúdo sexual ou nudez',
  'Assédio ou bullying',
];

export default function FeedCommentsReportModal({
  visible,
  colors,
  step,
  selectedReason,
  onClose,
  onSelectReason,
  onBack,
  onSubmit,
  onFinish,
}: FeedCommentsReportModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.container,
            {
              backgroundColor: colors.surfaceBright,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          {step === 1 ? (
            <>
              <Pressable
                hitSlop={8}
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialIcons name="close" size={20} color={colors.outline} />
              </Pressable>

              <Text style={[styles.title, { color: colors.onSurface }]}>
                Denunciar publicação
              </Text>

              <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
                Por que você está denunciando esta interação?
              </Text>

              <View style={styles.optionsList}>
                {REPORT_REASONS.map((reason) => (
                  <Pressable
                    key={reason}
                    onPress={() => onSelectReason(reason)}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        borderColor: colors.outlineVariant,
                        backgroundColor: colors.surfaceContainer,
                      },
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <Text style={[styles.optionText, { color: colors.onSurface }]}>
                      {reason}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: 'rgba(215,0,21,0.10)' },
                ]}
              >
                <MaterialIcons name="flag" size={28} color="#D70015" />
              </View>

              <Text style={[styles.title, { color: colors.onSurface }]}>
                Confirmar denúncia
              </Text>

              <Text style={[styles.descriptionCentered, { color: colors.onSurfaceVariant }]}>
                Você está denunciando este conteúdo por
              </Text>

              <Text style={[styles.reason, { color: colors.onSurface }]}>
                {selectedReason}
              </Text>

              <Text style={[styles.descriptionCentered, { color: colors.onSurfaceVariant }]}>
                Esta ação é anônima.
              </Text>

              <View style={styles.actions}>
                <Pressable
                  onPress={onBack}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.outlineVariant,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.onSurface }]}>
                    Voltar
                  </Text>
                </Pressable>

                <Pressable
                  onPress={onSubmit}
                  style={({ pressed }) => [
                    styles.primaryDangerButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.primaryDangerButtonText}>Denunciar</Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: colors.greenBgSoft },
                ]}
              >
                <MaterialIcons
                  name="check-circle"
                  size={28}
                  color={colors.greenText}
                />
              </View>

              <Text style={[styles.title, { color: colors.onSurface }]}>
                Denúncia recebida
              </Text>

              <Text style={[styles.descriptionCentered, { color: colors.onSurfaceVariant }]}>
                Obrigado por ajudar a manter a comunidade segura. Nossa equipe
                analisará o caso o mais rápido possível.
              </Text>

              <Pressable
                onPress={onFinish}
                style={({ pressed }) => [
                  styles.finishButton,
                  {
                    backgroundColor: colors.surfaceContainer,
                    borderColor: colors.outlineVariant,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.finishButtonText, { color: colors.onSurface }]}>
                  Concluir
                </Text>
              </Pressable>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  container: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  description: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  descriptionCentered: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  optionsList: {
    marginTop: 16,
    gap: 10,
  },
  option: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  optionPressed: {
    opacity: 0.84,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  reason: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  actions: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  primaryDangerButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#D70015',
  },
  primaryDangerButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  finishButton: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  finishButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});