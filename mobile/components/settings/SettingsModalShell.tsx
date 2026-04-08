import React from 'react';
import { useColorScheme } from 'react-native';
import {
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';

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
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
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