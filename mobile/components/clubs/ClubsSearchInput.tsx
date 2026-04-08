import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import type { ClubsThemeColors } from '../../constants/clubsTheme';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  colors: ClubsThemeColors;
  placeholder?: string;
};

export default function ClubsSearchInput({
  value,
  onChangeText,
  colors,
  placeholder = 'Buscar novos clubes...',
}: Props) {
  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <MaterialIcons name="search" size={20} color={colors.muted} />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[styles.input, { color: colors.text }]}
        selectionColor={colors.green}
        autoCorrect={false}
        autoCapitalize="sentences"
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
});