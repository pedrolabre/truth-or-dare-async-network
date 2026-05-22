import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { ClubsThemeColors } from '../../constants/clubsTheme';
import { useClubPromptComposer } from '../../hooks/useClubPromptComposer';
import type { ClubPromptComposerSubmit } from '../../types/clubs';
import type { ClubPromptTypeApi } from '../../types/clubsApi';

type Props = {
  visible: boolean;
  canPostPrompt: boolean;
  colors: ClubsThemeColors;
  onClose: () => void;
  onSubmitPrompt: ClubPromptComposerSubmit;
};

const PROMPT_TYPE_OPTIONS = [
  {
    label: 'Verdade',
    value: 'truth',
    iconName: 'chat-bubble-outline',
  },
  {
    label: 'Desafio',
    value: 'dare',
    iconName: 'local-fire-department',
  },
] as const satisfies readonly {
  label: string;
  value: ClubPromptTypeApi;
  iconName: keyof typeof MaterialIcons.glyphMap;
}[];

export default function ClubPromptComposerModal({
  visible,
  canPostPrompt,
  colors,
  onClose,
  onSubmitPrompt,
}: Props) {
  const composer = useClubPromptComposer({
    canPostPrompt,
    submitPrompt: onSubmitPrompt,
  });
  const resetComposer = composer.reset;

  React.useEffect(() => {
    if (!visible) {
      resetComposer();
    }
  }, [resetComposer, visible]);

  async function handleSubmit() {
    const prompt = await composer.handleSubmit();

    if (prompt) {
      onClose();
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <MaterialIcons name="add-comment" size={22} color={colors.green} />
              <Text style={[styles.title, { color: colors.text }]}>
                Novo prompt
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar prompt"
              onPress={onClose}
              hitSlop={10}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          {!canPostPrompt ? (
            <View style={styles.lockedState}>
              <View
                style={[
                  styles.lockedIcon,
                  { backgroundColor: colors.surfaceSoft },
                ]}
              >
                <MaterialIcons
                  name="lock-outline"
                  size={28}
                  color={colors.muted}
                />
              </View>
              <Text style={[styles.lockedTitle, { color: colors.text }]}>
                Sem permissao
              </Text>
              <Text style={[styles.lockedText, { color: colors.subText }]}>
                Entre no clube com permissao ativa para postar prompts.
              </Text>
            </View>
          ) : (
            <>
              {composer.submitErrorMessage ? (
                <View
                  style={[
                    styles.errorBox,
                    {
                      backgroundColor: colors.redSoft,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.errorText, { color: colors.red }]}>
                    {composer.submitErrorMessage}
                  </Text>
                </View>
              ) : null}

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.typeGrid}>
                  {PROMPT_TYPE_OPTIONS.map((option) => {
                    const isSelected = option.value === composer.type;

                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => composer.setType(option.value)}
                        style={({ pressed }) => [
                          styles.typeButton,
                          {
                            backgroundColor: isSelected
                              ? colors.green
                              : colors.surfaceSoft,
                            borderColor: isSelected
                              ? colors.green
                              : colors.cardBorder,
                          },
                          pressed && styles.pressed,
                        ]}
                      >
                        <MaterialIcons
                          name={option.iconName}
                          size={18}
                          color={isSelected ? colors.white : colors.green}
                        />
                        <Text
                          style={[
                            styles.typeText,
                            { color: isSelected ? colors.white : colors.text },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.fieldBlock}>
                  <View style={styles.fieldLabelRow}>
                    <Text style={[styles.fieldLabel, { color: colors.green }]}>
                      Prompt
                    </Text>
                    <Text
                      style={[
                        styles.counterText,
                        {
                          color: composer.contentError
                            ? colors.red
                            : colors.muted,
                        },
                      ]}
                    >
                      {composer.contentCharacterCount}/
                      {composer.contentMaxLength}
                    </Text>
                  </View>
                  <TextInput
                    value={composer.content}
                    onChangeText={composer.setContent}
                    placeholder="Escreva uma verdade ou desafio para o clube."
                    placeholderTextColor={colors.muted}
                    multiline
                    maxLength={composer.contentMaxLength}
                    textAlignVertical="top"
                    style={[
                      styles.textarea,
                      {
                        backgroundColor: colors.surfaceSoft,
                        borderColor: composer.contentError
                          ? colors.red
                          : colors.cardBorder,
                        color: colors.text,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.helperText,
                      {
                        color: composer.contentError
                          ? colors.red
                          : colors.muted,
                      },
                    ]}
                  >
                    {composer.contentError ?? 'Publicado no clube apos salvar.'}
                  </Text>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={[styles.fieldLabel, { color: colors.green }]}>
                    Dificuldade
                  </Text>
                  <TextInput
                    value={composer.difficulty}
                    onChangeText={composer.setDifficulty}
                    placeholder="Opcional"
                    placeholderTextColor={colors.muted}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceSoft,
                        borderColor: composer.difficultyError
                          ? colors.red
                          : colors.cardBorder,
                        color: colors.text,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.helperText,
                      {
                        color: composer.difficultyError
                          ? colors.red
                          : colors.muted,
                      },
                    ]}
                  >
                    {composer.difficultyError ?? 'Ex: leve, medio ou intenso.'}
                  </Text>
                </View>

                {composer.type === 'dare' ? (
                  <View style={styles.fieldBlock}>
                    <Text style={[styles.fieldLabel, { color: colors.green }]}>
                      Tentativas maximas
                    </Text>
                    <TextInput
                      value={composer.maxAttemptsText}
                      onChangeText={composer.setMaxAttemptsText}
                      placeholder="Opcional"
                      placeholderTextColor={colors.muted}
                      keyboardType="number-pad"
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surfaceSoft,
                          borderColor: composer.maxAttemptsError
                            ? colors.red
                            : colors.cardBorder,
                          color: colors.text,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.helperText,
                        {
                          color: composer.maxAttemptsError
                            ? colors.red
                            : colors.muted,
                        },
                      ]}
                    >
                      {composer.maxAttemptsError ?? 'Deixe vazio para ilimitado.'}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  onPress={composer.toggleMembersOnly}
                  style={({ pressed }) => [
                    styles.toggleRow,
                    {
                      backgroundColor: colors.surfaceSoft,
                      borderColor: colors.cardBorder,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.toggleTextWrap}>
                    <Text style={[styles.toggleTitle, { color: colors.text }]}>
                      Somente membros
                    </Text>
                    <Text
                      style={[styles.toggleDescription, { color: colors.subText }]}
                    >
                      O prompt fica restrito ao clube.
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkBox,
                      {
                        backgroundColor: composer.isMembersOnly
                          ? colors.green
                          : 'transparent',
                        borderColor: composer.isMembersOnly
                          ? colors.green
                          : colors.cardBorder,
                      },
                    ]}
                  >
                    {composer.isMembersOnly ? (
                      <MaterialIcons name="check" size={16} color={colors.white} />
                    ) : null}
                  </View>
                </Pressable>
              </ScrollView>

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !composer.canSubmit }}
                disabled={!composer.canSubmit}
                onPress={() => {
                  void handleSubmit();
                }}
                testID="club-prompt-submit"
                style={({ pressed }) => [
                  styles.submitButton,
                  {
                    backgroundColor: composer.canSubmit
                      ? colors.green
                      : colors.surfaceStrong,
                  },
                  pressed && composer.canSubmit && styles.pressed,
                ]}
              >
                {composer.isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <MaterialIcons
                    name="send"
                    size={18}
                    color={composer.canSubmit ? colors.white : colors.muted}
                  />
                )}
                <Text
                  style={[
                    styles.submitText,
                    { color: composer.canSubmit ? colors.white : colors.muted },
                  ]}
                >
                  Publicar
                </Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 22,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    maxHeight: 520,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 6,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '900',
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  counterText: {
    fontSize: 11,
    fontWeight: '900',
  },
  textarea: {
    minHeight: 132,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  toggleRow: {
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleTextWrap: {
    flex: 1,
    gap: 3,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  toggleDescription: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    minHeight: 48,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: {
    fontSize: 13,
    fontWeight: '900',
  },
  lockedState: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  lockedIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  lockedText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});
