import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type DeleteChallengeConfirmModalProps = {
  visible: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  backdropColor: string;
  cardBackgroundColor: string;
  borderColor: string;
  iconBackgroundColor: string;
  iconColor: string;
  titleColor: string;
  descriptionColor: string;
  cancelBackgroundColor: string;
  cancelTextColor: string;
  confirmBackgroundColor: string;
  confirmTextColor: string;
};

export default function DeleteChallengeConfirmModal({
  visible,
  title,
  description,
  onCancel,
  onConfirm,
  backdropColor,
  cardBackgroundColor,
  borderColor,
  iconBackgroundColor,
  iconColor,
  titleColor,
  descriptionColor,
  cancelBackgroundColor,
  cancelTextColor,
  confirmBackgroundColor,
  confirmTextColor,
}: DeleteChallengeConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={[styles.backdrop, { backgroundColor: backdropColor }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: cardBackgroundColor,
              borderColor,
            },
          ]}
        >
          <View style={styles.topSection}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: iconBackgroundColor },
              ]}
            >
              <MaterialIcons name="delete-outline" size={28} color={iconColor} />
            </View>

            <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
            <Text style={[styles.description, { color: descriptionColor }]}>
              {description}
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.secondaryButton,
                { backgroundColor: cancelBackgroundColor },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: cancelTextColor },
                ]}
              >
                VOLTAR
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: confirmBackgroundColor },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: confirmTextColor },
                ]}
              >
                EXCLUIR POST
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  topSection: {
    alignItems: 'center',
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  description: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    textAlign: 'center',
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
});