import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { FeedFilterOption, FilterKey } from '../../types/feed';

type FeedFiltersProps = {
  filters: FeedFilterOption[];
  activeFilter: FilterKey;
  onSelectFilter: (filter: FilterKey) => void;
  selectedBackgroundColor: string;
  selectedTextColor: string;
  unselectedBackgroundColor: string;
  unselectedTextColor: string;
  unselectedBorderColor: string;
};

export default function FeedFilters({
  filters,
  activeFilter,
  onSelectFilter,
  selectedBackgroundColor,
  selectedTextColor,
  unselectedBackgroundColor,
  unselectedTextColor,
  unselectedBorderColor,
}: FeedFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
    >
      {filters.map((filter) => {
        const selected = filter.key === activeFilter;

        return (
          <Pressable
            key={filter.key}
            onPress={() => onSelectFilter(filter.key)}
            style={({ pressed }) => [
              styles.filterChip,
              selected
                ? { backgroundColor: selectedBackgroundColor }
                : {
                    backgroundColor: unselectedBackgroundColor,
                    borderColor: unselectedBorderColor,
                    borderWidth: 1,
                  },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: selected ? selectedTextColor : unselectedTextColor,
                },
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    gap: 12,
    paddingBottom: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});