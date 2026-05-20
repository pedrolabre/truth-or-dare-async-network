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
import type { GroupIconName } from '../../types/createGroup';

type Props = {
  colors: CreateGroupThemeColors;
  name: string;
  description: string;
  selectedIcon: GroupIconName;
  nameError: string | null;
  descriptionError: string | null;
  descriptionWarning: string | null;
  descriptionCharacterCount: number;
  descriptionMaxLength: number;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onPressIcon: () => void;
};

export default function CreateGroupIdentityCard({
  colors,
  name,
  description,
  selectedIcon,
  nameError,
  descriptionError,
  descriptionWarning,
  descriptionCharacterCount,
  descriptionMaxLength,
  onChangeName,
  onChangeDescription,
  onPressIcon,
}: Props) {
  const shouldShowNameError = name.length > 0 && nameError !== null;
  const descriptionFeedback = descriptionError ?? descriptionWarning;
  const descriptionFeedbackColor = descriptionError ? colors.red : colors.green;

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
                  borderColor: shouldShowNameError ? colors.red : colors.outline,
                  color: colors.text,
                },
              ]}
            />
            <Text
              style={[
                styles.fieldHelper,
                { color: shouldShowNameError ? colors.red : colors.muted },
              ]}
            >
              {shouldShowNameError
                ? nameError
                : '3 a 80 caracteres. O link final sera definido ao criar.'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelRow}>
          <Text style={[styles.fieldLabel, { color: colors.green }]}>
            Descrição do Clube
          </Text>
          <Text
            style={[
              styles.counterText,
              { color: descriptionError ? colors.red : colors.muted },
            ]}
          >
            {descriptionCharacterCount}/{descriptionMaxLength}
          </Text>
        </View>
        <TextInput
          value={description}
          onChangeText={onChangeDescription}
          placeholder="O que define esse grupo?"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={descriptionMaxLength}
          textAlignVertical="top"
          style={[
            styles.textarea,
            {
              backgroundColor: colors.white,
              borderColor: descriptionError ? colors.red : colors.outline,
              color: colors.text,
            },
          ]}
        />
        {descriptionFeedback ? (
          <Text style={[styles.fieldHelper, { color: descriptionFeedbackColor }]}>
            {descriptionFeedback}
          </Text>
        ) : (
          <Text style={[styles.fieldHelper, { color: colors.muted }]}>
            Descrição opcional.
          </Text>
        )}
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
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fieldHelper: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  counterText: {
    fontSize: 11,
    fontWeight: '900',
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
