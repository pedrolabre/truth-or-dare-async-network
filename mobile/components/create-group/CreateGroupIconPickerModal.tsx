import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { CreateGroupThemeColors } from '../../constants/createGroupTheme';
import type { GroupIconName } from '../../types/createGroup';

type Props = {
  visible: boolean;
  colors: CreateGroupThemeColors;
  icons: GroupIconName[];
  selectedIcon: GroupIconName;
  onClose: () => void;
  onSelectIcon: (icon: GroupIconName) => void;
};

export default function CreateGroupIconPickerModal({
  visible,
  colors,
  icons,
  selectedIcon,
  onClose,
  onSelectIcon,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outline,
            },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Foto do Grupo
          </Text>

          <View style={styles.iconGrid}>
            {icons.map((icon) => {
              const isSelected = icon === selectedIcon;

              return (
                <Pressable
                  key={icon}
                  onPress={() => onSelectIcon(icon)}
                  style={({ pressed }) => [
                    styles.iconOption,
                    {
                      backgroundColor: isSelected
                        ? colors.green
                        : colors.surfaceSoft,
                      borderColor: isSelected ? colors.green : colors.outline,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialIcons
                    name={icon}
                    size={28}
                    color={isSelected ? colors.white : colors.text}
                  />
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={onClose} style={styles.modalClose}>
            <Text style={[styles.modalCloseText, { color: colors.muted }]}>
              Cancelar
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    gap: 18,
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  iconOption: {
    width: 62,
    height: 62,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClose: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  modalCloseText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});