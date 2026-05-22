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
import type { ClubFeedItemApi } from '../../types/clubsApi';

type Props = {
  visible: boolean;
  prompt: ClubFeedItemApi | null;
  colors: ClubsThemeColors;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
};

const MAX_TRUTH_RESPONSE_LENGTH = 1000;

export default function ClubTruthResponseModal({
  visible,
  prompt,
  colors,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  const [text, setText] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const promptId = prompt?.id ?? null;
  const trimmedText = text.trim();
  const remainingCharacters = MAX_TRUTH_RESPONSE_LENGTH - text.length;
  const canSubmit =
    Boolean(prompt) &&
    trimmedText.length > 0 &&
    text.length <= MAX_TRUTH_RESPONSE_LENGTH &&
    !isSubmitting;

  React.useEffect(() => {
    if (visible) {
      setText('');
      setErrorMessage(null);
    }
  }, [promptId, visible]);

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setErrorMessage(null);

    try {
      await onSubmit(trimmedText);
      setText('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : 'Nao foi possivel enviar sua resposta.',
      );
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
          testID="club-truth-response-modal"
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: colors.greenSoft }]}>
              <MaterialIcons name="help-outline" size={24} color={colors.green} />
            </View>

            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>
                Responder verdade
              </Text>
              <Text
                numberOfLines={3}
                style={[styles.promptText, { color: colors.subText }]}
              >
                {prompt?.content ?? 'Prompt indisponivel.'}
              </Text>
            </View>
          </View>

          <TextInput
            testID="club-truth-response-input"
            value={text}
            editable={!isSubmitting}
            onChangeText={(nextText) => {
              setText(nextText);
              setErrorMessage(null);
            }}
            placeholder="Escreva sua resposta..."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={MAX_TRUTH_RESPONSE_LENGTH}
            textAlignVertical="top"
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceSoft,
                borderColor: colors.cardBorder,
                color: colors.text,
              },
            ]}
          />

          <View style={styles.footerRow}>
            <Text style={[styles.helperText, { color: colors.subText }]}>
              {remainingCharacters} caracteres restantes
            </Text>
          </View>

          {errorMessage ? (
            <Text
              testID="club-truth-response-error"
              style={[styles.errorText, { color: colors.red }]}
            >
              {errorMessage}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onClose}
              style={({ pressed }) => [
                styles.secondaryButton,
                { backgroundColor: colors.surfaceSoft },
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
              testID="club-truth-response-submit"
              onPress={() => {
                void handleSubmit();
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: canSubmit
                    ? colors.green
                    : colors.surfaceStrong,
                },
                pressed && canSubmit && styles.pressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <MaterialIcons name="send" size={17} color={colors.white} />
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
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'center',
    padding: 18,
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
  input: {
    minHeight: 142,
    maxHeight: 190,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 13,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  footerRow: {
    alignItems: 'flex-end',
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
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
