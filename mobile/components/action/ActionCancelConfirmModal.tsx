import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type ActionCancelConfirmModalProps = {
  visible: boolean;
  titleColor: string;
  descriptionColor: string;
  backgroundColor: string;
  overlayColor: string;
  primaryColor: string;
  primaryTextColor: string;
  secondaryColor: string;
  secondaryTextColor: string;
  onConfirmExit: () => void;
  onCancel: () => void;
};

export default function ActionCancelConfirmModal({
  visible,
  titleColor,
  descriptionColor,
  backgroundColor,
  overlayColor,
  primaryColor,
  primaryTextColor,
  secondaryColor,
  secondaryTextColor,
  onConfirmExit,
  onCancel,
}: ActionCancelConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
        <View style={[styles.container, { backgroundColor }]}>
          <Text style={[styles.title, { color: titleColor }]}>
            Cancelar desafio?
          </Text>

          <Text style={[styles.description, { color: descriptionColor }]}>
            Tem certeza que deseja sair agora? Seu progresso atual será perdido.
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.secondaryButton,
                { backgroundColor: secondaryColor },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.secondaryText, { color: secondaryTextColor }]}>
                Continuar
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirmExit}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: primaryColor },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.primaryText, { color: primaryTextColor }]}>
                Sair
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});