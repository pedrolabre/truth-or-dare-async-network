import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { SearchThemeColors } from '../../constants/searchTheme';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  colors: SearchThemeColors;
  placeholder?: string;
  onClear?: () => void;
  onPressFilter?: () => void;
};

export default function SearchBar({
  value,
  onChangeText,
  colors,
  placeholder = 'Encontre jogadores ou clubes...',
  onClear,
  onPressFilter,
}: Props) {
  const canClear = value.length > 0 && typeof onClear === 'function';

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
        },
      ]}
    >
      <View style={styles.leftIconWrap}>
        <MaterialIcons name="search" size={20} color={colors.muted} />
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel="Campo de busca"
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            color: colors.text,
          },
        ]}
        selectionColor={colors.green}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {canClear ? (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Limpar campo de busca"
          hitSlop={8}
          style={({ pressed }) => [
            styles.clearButton,
            { backgroundColor: colors.surfaceStrong },
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name="close" size={18} color={colors.subText} />
        </Pressable>
      ) : null}

      <Pressable
        onPress={onPressFilter}
        accessibilityRole="button"
        accessibilityLabel="Abrir filtros de busca"
        hitSlop={8}
        style={({ pressed }) => [
          styles.filterButton,
          {
            backgroundColor: colors.red,
          },
          pressed && styles.pressed,
        ]}
      >
        <MaterialIcons name="tune" size={18} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 8,
    gap: 10,
  },
  leftIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 56,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
});
