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
        <Text style={[styles.clearText, { color: colors.red }]} onPress={onClearAll}>
          Limpar tudo
        </Text>
      </View>

      <View style={styles.list}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onPressItem?.(item)}
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
              style={({ pressed }) => [pressed && styles.iconPressed]}
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
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  iconPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
});