import React from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function SettingsModalShell({
  visible,
  onClose,
  children,
}: Props) {
  const { isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        testID="settings-modal-overlay"
        style={[
          styles.overlay,
          {
            backgroundColor: isDark
              ? 'rgba(0,0,0,0.8)'
              : 'rgba(0,0,0,0.6)',
          },
        ]}
        onPress={onClose}
      >
        <Pressable
          testID="settings-modal-card"
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1c1f1d' : '#ffffff',
            },
          ]}
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 28,
    padding: 24,
  },
});
