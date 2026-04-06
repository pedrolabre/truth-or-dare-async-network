import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { FeedCommentsColors } from '../../types/comments';

type FeedCommentsMuteModalProps = {
  visible: boolean;
  colors: FeedCommentsColors;
  onClose: () => void;
};

export default function FeedCommentsMuteModal({
  visible,
  colors,
  onClose,
}: FeedCommentsMuteModalProps) {
  function handleConfirmMute() {
    console.log('Publicação silenciada');
    onClose();
  }

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
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: colors.greenBgSoft },
            ]}
          >
            <MaterialIcons
              name="notifications-off"
              size={28}
              color={colors.greenText}
            />
          </View>

          <Text style={[styles.title, { color: colors.onSurface }]}>
            Silenciar notificações?
          </Text>

          <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
            Você deixará de receber alertas sobre novos comentários e reações nesta
            publicação.
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
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
                Cancelar
              </Text>
            </Pressable>

            <Pressable
              onPress={handleConfirmMute}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.primaryButtonText, { color: colors.white }]}>
                Silenciar
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  container: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  description: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  actions: {
    marginTop: 22,
    width: '100%',
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
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});