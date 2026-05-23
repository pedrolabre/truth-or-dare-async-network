import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { ClubsThemeColors } from '../../constants/clubsTheme';
import type { ClubReportReasonOption, ClubReportTarget } from '../../types/clubs';
import type { ClubReportReasonApi } from '../../types/clubsApi';

type Props = {
  visible: boolean;
  colors: ClubsThemeColors;
  target: ClubReportTarget | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    reason: ClubReportReasonApi;
    details: string | null;
  }) => Promise<unknown>;
  onFinish: () => void;
};

const REPORT_REASONS: ClubReportReasonOption[] = [
  { label: 'Spam ou golpe', reason: 'spam' },
  { label: 'Odio ou ofensa', reason: 'hate' },
  { label: 'Conteudo sexual', reason: 'sexual' },
  { label: 'Assedio ou bullying', reason: 'harassment' },
  { label: 'Violencia ou risco', reason: 'violence' },
  { label: 'Outro problema', reason: 'other' },
];

function getTargetLabel(target: ClubReportTarget | null) {
  if (!target) {
    return 'conteudo';
  }

  if (target.type === 'club') {
    return 'clube';
  }

  if (target.type === 'prompt') {
    return 'prompt';
  }

  if (target.type === 'response') {
    return 'resposta';
  }

  return 'comentario';
}

export default function ClubReportModal({
  visible,
  colors,
  target,
  isSubmitting,
  errorMessage,
  successMessage,
  onClose,
  onSubmit,
  onFinish,
}: Props) {
  const [selectedReason, setSelectedReason] =
    React.useState<ClubReportReasonApi | null>(null);
  const [details, setDetails] = React.useState('');

  React.useEffect(() => {
    if (!visible) {
      setSelectedReason(null);
      setDetails('');
    }
  }, [visible]);

  const isSuccess = Boolean(successMessage);
  const canSubmit = Boolean(selectedReason) && !isSubmitting && !isSuccess;
  const targetLabel = getTargetLabel(target);

  async function handleSubmit() {
    if (!selectedReason || isSubmitting) {
      return;
    }

    await onSubmit({
      reason: selectedReason,
      details: details.trim() || null,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.titleStack}>
              <Text style={[styles.title, { color: colors.text }]}>
                {isSuccess ? 'Denuncia enviada' : `Denunciar ${targetLabel}`}
              </Text>
              <Text style={[styles.subtitle, { color: colors.subText }]}>
                {target?.title ?? 'Ajude a manter o clube seguro.'}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              hitSlop={8}
              testID="club-report-close"
              onPress={onClose}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
                isSubmitting && styles.disabled,
              ]}
            >
              <MaterialIcons name="close" size={20} color={colors.muted} />
            </Pressable>
          </View>

          {isSuccess ? (
            <View testID="club-report-success" style={styles.successBox}>
              <MaterialIcons
                name="check-circle"
                size={34}
                color={colors.green}
              />
              <Text style={[styles.successText, { color: colors.text }]}>
                {successMessage}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.reasonGrid}>
                {REPORT_REASONS.map((option) => {
                  const isSelected = selectedReason === option.reason;

                  return (
                    <Pressable
                      key={option.reason}
                      accessibilityRole="button"
                      testID={`club-report-reason-${option.reason}`}
                      disabled={isSubmitting}
                      onPress={() => setSelectedReason(option.reason)}
                      style={({ pressed }) => [
                        styles.reasonButton,
                        {
                          backgroundColor: isSelected
                            ? colors.greenSoft
                            : colors.surfaceSoft,
                          borderColor: isSelected
                            ? colors.green
                            : colors.cardBorder,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.reasonText,
                          { color: isSelected ? colors.green : colors.text },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                testID="club-report-details"
                value={details}
                onChangeText={setDetails}
                placeholder="Detalhes opcionais"
                placeholderTextColor={colors.muted}
                multiline
                maxLength={500}
                editable={!isSubmitting}
                style={[
                  styles.detailsInput,
                  {
                    backgroundColor: colors.surfaceSoft,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  },
                ]}
              />
            </>
          )}

          {errorMessage && !isSuccess ? (
            <Text testID="club-report-error" style={[styles.errorText, { color: colors.red }]}>
              {errorMessage}
            </Text>
          ) : null}

          <View style={styles.actions}>
            {isSuccess ? (
              <Pressable
                accessibilityRole="button"
                testID="club-report-finish"
                onPress={onFinish}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: colors.green },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.primaryButtonText, { color: colors.white }]}>
                  Concluir
                </Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    { borderColor: colors.cardBorder },
                    pressed && styles.pressed,
                    isSubmitting && styles.disabled,
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
                  testID="club-report-submit"
                  onPress={() => {
                    void handleSubmit();
                  }}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    {
                      backgroundColor: canSubmit
                        ? colors.red
                        : colors.surfaceStrong,
                    },
                    pressed && canSubmit && styles.pressed,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text
                      style={[
                        styles.primaryButtonText,
                        { color: canSubmit ? colors.white : colors.muted },
                      ]}
                    >
                      Denunciar
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.28)',
    padding: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleStack: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonButton: {
    minHeight: 38,
    maxWidth: '100%',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  detailsInput: {
    minHeight: 84,
    maxHeight: 128,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  successBox: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  successText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  errorText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  secondaryButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  primaryButton: {
    minWidth: 112,
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
