import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { SearchThemeColors } from '../../constants/searchTheme';

type Props = {
  colors: SearchThemeColors;
  variant?: 'user' | 'club';
};

export default function SearchSkeletonCard({
  colors,
  variant = 'user',
}: Props) {
  const isClub = variant === 'club';

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={
        isClub ? 'Carregando clube da busca' : 'Carregando usuario da busca'
      }
      style={[
        styles.card,
        {
          minHeight: isClub ? 98 : 84,
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View
        style={[
          isClub ? styles.clubIcon : styles.avatar,
          { backgroundColor: colors.surfaceStrong },
        ]}
      />

      <View style={styles.content}>
        <View
          style={[
            styles.line,
            styles.lineStrong,
            { backgroundColor: colors.surfaceStrong },
          ]}
        />
        <View
          style={[
            styles.line,
            styles.lineMedium,
            { backgroundColor: colors.surfaceSoft },
          ]}
        />
        <View
          style={[
            styles.line,
            styles.lineSmall,
            { backgroundColor: colors.surfaceSoft },
          ]}
        />
      </View>

      <View
        style={[
          styles.action,
          { backgroundColor: colors.surfaceSoft },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 999,
  },
  clubIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  line: {
    height: 10,
    borderRadius: 999,
  },
  lineStrong: {
    width: '64%',
  },
  lineMedium: {
    width: '82%',
  },
  lineSmall: {
    width: '42%',
  },
  action: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
});
