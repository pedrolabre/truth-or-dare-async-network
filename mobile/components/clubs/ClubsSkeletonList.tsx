import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ClubsThemeColors } from '../../constants/clubsTheme';

type Props = {
  colors: ClubsThemeColors;
  count?: number;
};

export default function ClubsSkeletonList({
  colors,
  count = 3,
}: Props) {
  return (
    <View testID="clubs-skeleton-list" style={styles.list}>
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          testID="clubs-skeleton-card"
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View
            style={[
              styles.icon,
              { backgroundColor: colors.surfaceStrong },
            ]}
          />

          <View style={styles.content}>
            <View
              style={[
                styles.titleLine,
                { backgroundColor: colors.surfaceStrong },
              ]}
            />
            <View
              style={[
                styles.descriptionLine,
                { backgroundColor: colors.surfaceSoft },
              ]}
            />
            <View
              style={[
                styles.metaLine,
                { backgroundColor: colors.surfaceSoft },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  card: {
    minHeight: 88,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  content: {
    flex: 1,
    gap: 10,
  },
  titleLine: {
    width: '58%',
    height: 14,
    borderRadius: 999,
  },
  descriptionLine: {
    width: '88%',
    height: 12,
    borderRadius: 999,
  },
  metaLine: {
    width: '38%',
    height: 10,
    borderRadius: 999,
  },
});
