import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type {
  FeedCommentActionTarget,
  FeedCommentsColors,
} from '../../types/comments';

type FeedCommentEditModalProps = {
  visible: boolean;
  colors: FeedCommentsColors;
  target: FeedCommentActionTarget | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (text: string) => void;
};

export default function FeedCommentEditModal({
  visible,
  colors,
  target,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: FeedCommentEditModalProps) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (visible) {
      setText(target?.content ?? '');
    }
  }, [target?.content, visible]);

  const trimmedText = text.trim();

  const canSubmit = useMemo(() => {
    return trimmedText.length > 0 && trimmedText !== (target?.content ?? '').trim();
  }, [target?.content, trimmedText]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
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
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.greenBgSoft },
                ]}
              >
                <MaterialIcons name="edit" size={20} color={colors.headerGreen} />
              </View>

              <View style={styles.titleContent}>
                <Text style={[styles.title, { color: colors.onSurface }]}>
                  Editar comentário
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
                >
                  Altere apenas o texto desta resposta.
                </Text>
              </View>
            </View>

            <Pressable
              disabled={isSubmitting}
              onPress={onClose}
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

          <TextInput
            value={text}
            onChangeText={setText}
            editable={!isSubmitting}
            multiline
            maxLength={500}
            placeholder="Edite seu comentário..."
            placeholderTextColor={colors.outline}
            style={[
              styles.input,
              {
                color: colors.onSurface,
                borderColor: colors.outlineVariant,
                backgroundColor: colors.surfaceContainerLow,
              },
            ]}
          />

          <View style={styles.metaRow}>
            <Text style={[styles.counter, { color: colors.outline }]}>
              {text.length}/500
            </Text>
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.footer}>
            <Pressable
              disabled={isSubmitting}
              onPress={onClose}
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
                Cancelar
              </Text>
            </Pressable>

            <Pressable
              disabled={!canSubmit || isSubmitting}
              onPress={() => onSubmit(trimmedText)}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: colors.headerGreen },
                pressed && styles.pressed,
                (!canSubmit || isSubmitting) && styles.disabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.primaryButtonText, { color: colors.white }]}>
                  Salvar
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  input: {
    minHeight: 118,
    maxHeight: 180,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  metaRow: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  counter: {
    fontSize: 11,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 10,
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
    minWidth: 96,
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