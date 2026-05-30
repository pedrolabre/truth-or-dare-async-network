import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { SearchThemeColors } from '../../constants/searchTheme';

type Props = {
  colors: SearchThemeColors;
  label?: string;
};

export default function SearchLoadMore({
  colors,
  label = 'Carregando mais resultados',
}: Props) {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.surfaceSoft,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <ActivityIndicator color={colors.green} />
      <Text style={[styles.label, { color: colors.subText }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
  },
});
