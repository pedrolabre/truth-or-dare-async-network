import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SearchThemeColors } from '../../constants/searchTheme';
import type { SearchFilterKey } from '../../types/search';

type FilterItem = {
  key: SearchFilterKey;
  label: string;
};

type Props = {
  activeFilter: SearchFilterKey;
  onSelect: (filter: SearchFilterKey) => void;
  colors: SearchThemeColors;
};

const FILTERS: FilterItem[] = [
  { key: 'all', label: 'Tudo' },
  { key: 'users', label: 'Usuários' },
  { key: 'clubs', label: 'Clubes' },
];

export default function SearchFilterPills({
  activeFilter,
  onSelect,
  colors,
}: Props) {
  return (
    <View style={styles.container}>
      {FILTERS.map((filter) => {
        const isActive = filter.key === activeFilter;

        return (
          <Pressable
            key={filter.key}
            onPress={() => onSelect(filter.key)}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: isActive ? colors.chipActiveBg : colors.chipBg,
                borderColor: isActive ? colors.chipActiveBg : colors.outline,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? colors.chipActiveText : colors.chipText,
                },
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    minHeight: 38,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});