import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
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
} from '../../types/comments';

type FeedCommentDeleteConfirmModalProps = {
  visible: boolean;
  colors: FeedCommentsColors;
  target: FeedCommentActionTarget | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function FeedCommentDeleteConfirmModal({
  visible,
  colors,
  target,
  isSubmitting,
  errorMessage,
  onClose,
  onConfirm,
}: FeedCommentDeleteConfirmModalProps) {
  const targetLabel = target?.type === 'reply' ? 'resposta' : 'comentário';

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
          <View style={styles.iconWrapper}>
            <View style={[styles.iconCircle, { backgroundColor: colors.redBgSoft }]}>
              <MaterialIcons name="delete-outline" size={24} color="#D70015" />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.onSurface }]}>
            Excluir {targetLabel}?
          </Text>

          <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
            Essa ação não pode ser desfeita.{' '}
            {target?.type === 'comment'
              ? 'Se este comentário tiver respostas, elas também serão removidas.'
              : 'Apenas esta resposta será removida.'}
          </Text>

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
              disabled={isSubmitting}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.dangerButton,
                pressed && styles.pressed,
                isSubmitting && styles.disabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.dangerButtonText, { color: colors.white }]}>
                  Excluir
                </Text>
              )}
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  description: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 12,
    textAlign: 'center',
    color: '#D70015',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
  secondaryButton: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  dangerButton: {
    minWidth: 96,
    minHeight: 42,
    borderRadius: 999,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D70015',
  },
  dangerButtonText: {
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