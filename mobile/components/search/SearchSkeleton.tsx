import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { SearchThemeColors } from '../../constants/searchTheme';
import SearchSkeletonCard from './SearchSkeletonCard';

type Props = {
  colors: SearchThemeColors;
};

export default function SearchSkeleton({ colors }: Props) {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel="Carregando resultados da busca"
      style={styles.wrapper}
    >
      <View style={styles.section}>
        <View
          style={[
            styles.titleLine,
            { backgroundColor: colors.surfaceStrong },
          ]}
        />
        <SearchSkeletonCard colors={colors} variant="user" />
        <SearchSkeletonCard colors={colors} variant="user" />
      </View>

      <View style={styles.section}>
        <View
          style={[
            styles.titleLine,
            styles.titleLineShort,
            { backgroundColor: colors.surfaceStrong },
          ]}
        />
        <SearchSkeletonCard colors={colors} variant="club" />
        <SearchSkeletonCard colors={colors} variant="club" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 22,
  },
  section: {
    gap: 12,
  },
  titleLine: {
    width: 116,
    height: 12,
    borderRadius: 999,
  },
  titleLineShort: {
    width: 88,
  },
});
