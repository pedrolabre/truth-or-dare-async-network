import React, { useEffect } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function SettingsModalShell({
  visible,
  onClose,
  title,
  children,
}: Props) {
  const { isDark } = useTheme();

  useEffect(() => {
    if (visible) {
      AccessibilityInfo.announceForAccessibility?.(title);
    }
  }, [title, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        testID="settings-modal-keyboard-avoiding-view"
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          testID="settings-modal-overlay"
          accessibilityLabel={`Fechar modal ${title}`}
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
            accessibilityViewIsModal
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#1c1f1d' : '#ffffff',
              },
            ]}
            onPress={(event) => event?.stopPropagation?.()}
          >
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    maxHeight: '100%',
    borderRadius: 28,
    padding: 24,
  },
});
