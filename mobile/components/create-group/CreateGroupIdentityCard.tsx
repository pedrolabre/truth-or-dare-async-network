import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { CreateGroupThemeColors } from '../../constants/createGroupTheme';
import type { CreateGroupIconName } from '../../types/create-group';

type Props = {
  colors: CreateGroupThemeColors;
  name: string;
  description: string;
  selectedIcon: CreateGroupIconName;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onPressIcon: () => void;
};

export default function CreateGroupIdentityCard({
  colors,
  name,
  description,
  selectedIcon,
  onChangeName,
  onChangeDescription,
  onPressIcon,
}: Props) {
  return (
    <View
      style={[
        styles.mainCard,
        {
          backgroundColor: colors.surfaceSoft,
          borderColor: colors.outline,
        },
      ]}
    >
      <View style={styles.identityRow}>
        <Pressable
          onPress={onPressIcon}
          style={({ pressed }) => [
            styles.iconPicker,
            { backgroundColor: colors.green },
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name={selectedIcon} size={30} color={colors.white} />
          <Text style={[styles.iconPickerLabel, { color: colors.white }]}>
            Ícone
          </Text>
        </Pressable>

        <View style={styles.identityFields}>
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.green }]}>
              Nome do Grupo
            </Text>
            <TextInput
              value={name}
              onChangeText={onChangeName}
              placeholder="Ex: Galera do Truth or Dare"
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                {
                  backgroundColor: colors.white,
                  borderColor: colors.outline,
                  color: colors.text,
                },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={[styles.fieldLabel, { color: colors.green }]}>
          Descrição do Clube
        </Text>
        <TextInput
          value={description}
          onChangeText={onChangeDescription}
          placeholder="O que define esse grupo?"
          placeholderTextColor={colors.muted}
          multiline
          textAlignVertical="top"
          style={[
            styles.textarea,
            {
              backgroundColor: colors.white,
              borderColor: colors.outline,
              color: colors.text,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 18,
  },
  identityRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  iconPicker: {
    width: 92,
    height: 92,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconPickerLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  identityFields: {
    flex: 1,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  input: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  textarea: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});