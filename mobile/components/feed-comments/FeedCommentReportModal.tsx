import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {
  FeedCommentActionTarget,
  FeedCommentsColors,
  FeedCommentsReportReason,
} from '../../types/comments';

type FeedCommentReportModalProps = {
  visible: boolean;
  colors: FeedCommentsColors;
  target: FeedCommentActionTarget | null;
  selectedReason: FeedCommentsReportReason | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  isSuccess: boolean;
  onClose: () => void;
  onSelectReason: (reason: FeedCommentsReportReason) => void;
  onSubmit: () => void;
};

const REPORT_REASONS: FeedCommentsReportReason[] = [
  'Spam ou fraude',
  'Discurso de ódio ou ofensa',
  'Conteúdo sexual ou nudez',
  'Assédio ou bullying',
];

export default function FeedCommentReportModal({
  visible,
  colors,
  target,
  selectedReason,
  isSubmitting,
  errorMessage,
  isSuccess,
  onClose,
  onSelectReason,
  onSubmit,
}: FeedCommentReportModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const targetLabel = target?.type === 'reply' ? 'resposta' : 'comentário';

  const title = useMemo(() => {
    if (isSuccess) {
      return 'Denúncia enviada';
    }

    if (step === 2) {
      return 'Confirmar denúncia';
    }

    return `Denunciar ${targetLabel}`;
  }, [isSuccess, step, targetLabel]);

  function handleClose() {
    setStep(1);
    onClose();
  }

  function handleSubmit() {
    onSubmit();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceBright,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.redBgSoft }]}>
                <MaterialIcons name="flag" size={21} color="#D70015" />
              </View>

              <View style={styles.titleContent}>
                <Text style={[styles.title, { color: colors.onSurface }]}>
                  {title}
                </Text>
                {!isSuccess ? (
                  <Text
                    style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
                  >
                    Essa denúncia será analisada pela moderação.
                  </Text>
                ) : null}
              </View>
            </View>

            <Pressable
              disabled={isSubmitting}
              onPress={handleClose}
              hitSlop={8}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
                isSubmitting && styles.disabled,
              ]}
            >
              <MaterialIcons name="close" size={20} color={colors.outline} />
            </Pressable>
          </View>

          {isSuccess ? (
            <View style={styles.successBox}>
              <MaterialIcons
                name="check-circle"
                size={34}
                color={colors.headerGreen}
              />
              <Text style={[styles.successText, { color: colors.onSurface }]}>
                Obrigado. Sua denúncia foi registrada.
              </Text>
            </View>
          ) : step === 1 ? (
            <View style={styles.reasonList}>
              {REPORT_REASONS.map((reason) => {
                const selected = selectedReason === reason;

                return (
                  <Pressable
                    key={reason}
                    disabled={isSubmitting}
                    onPress={() => onSelectReason(reason)}
                    style={({ pressed }) => [
                      styles.reasonItem,
                      {
                        borderColor: selected
                          ? colors.headerGreen
                          : colors.outlineVariant,
                        backgroundColor: selected
                          ? colors.greenBgSoft
                          : colors.surfaceContainerLow,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.reasonText,
                        {
                          color: selected
                            ? colors.greenText
                            : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {reason}
                    </Text>

                    {selected ? (
                      <MaterialIcons
                        name="check-circle"
                        size={19}
                        color={colors.headerGreen}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.confirmBox}>
              <Text
                style={[
                  styles.confirmLabel,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                Motivo selecionado
              </Text>
              <Text style={[styles.confirmReason, { color: colors.onSurface }]}>
                {selectedReason}
              </Text>
            </View>
          )}

          {errorMessage && !isSuccess ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.footer}>
            {isSuccess ? (
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: colors.headerGreen },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.primaryButtonText, { color: colors.white }]}>
                  Fechar
                </Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  disabled={isSubmitting}
                  onPress={step === 1 ? handleClose : () => setStep(1)}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    { borderColor: colors.outlineVariant },
                    pressed && styles.pressed,
                    isSubmitting && styles.disabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    {step === 1 ? 'Cancelar' : 'Voltar'}
                  </Text>
                </Pressable>

                <Pressable
                  disabled={!selectedReason || isSubmitting}
                  onPress={step === 1 ? () => setStep(2) : handleSubmit}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: '#D70015' },
                    pressed && styles.pressed,
                    (!selectedReason || isSubmitting) && styles.disabled,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text
                      style={[styles.primaryButtonText, { color: colors.white }]}
                    >
                      {step === 1 ? 'Continuar' : 'Denunciar'}
                    </Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContent: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonList: {
    gap: 10,
  },
  reasonItem: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  confirmBox: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: 'rgba(215, 0, 21, 0.08)',
  },
  confirmLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confirmReason: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
  },
  successBox: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  successText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  errorText: {
    marginTop: 12,
    color: '#D70015',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  secondaryButton: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  primaryButton: {
    minWidth: 104,
    minHeight: 42,
    borderRadius: 999,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.55,
  },
});