import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { SearchThemeColors } from '../../constants/searchTheme';
import type { SearchRecentItem } from '../../types/search';

type Props = {
  items: SearchRecentItem[];
  colors: SearchThemeColors;
  onPressItem?: (item: SearchRecentItem) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
};

export default function SearchRecentSearches({
  items,
  colors,
  onPressItem,
  onRemoveItem,
  onClearAll,
}: Props) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Pressable
          onPress={onClearAll}
          accessibilityRole="button"
          accessibilityLabel="Limpar todas as buscas recentes"
          hitSlop={8}
          style={({ pressed }) => [
            styles.clearButton,
            pressed && styles.iconPressed,
          ]}
        >
          <Text style={[styles.clearText, { color: colors.red }]}>
            Limpar tudo
          </Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onPressItem?.(item)}
            accessibilityRole="button"
            accessibilityLabel={`Buscar novamente por ${item.label}`}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: colors.surfaceSoft,
                borderColor: colors.cardBorder,
              },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.left}>
              <MaterialIcons name="history" size={16} color={colors.muted} />
              <Text
                numberOfLines={1}
                style={[styles.label, { color: colors.text }]}
              >
                {item.label}
              </Text>
            </View>

            <Pressable
              hitSlop={8}
              onPress={() => onRemoveItem(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Remover ${item.label} das buscas recentes`}
              style={({ pressed }) => [
                styles.removeButton,
                pressed && styles.iconPressed,
              ]}
            >
              <MaterialIcons name="close" size={18} color={colors.muted} />
            </Pressable>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  header: {
    alignItems: 'flex-end',
  },
  clearButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '800',
  },
  list: {
    gap: 10,
  },
  row: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -10,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  iconPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
});
