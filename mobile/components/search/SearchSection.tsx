import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SearchThemeColors } from '../../constants/searchTheme';

type Props = {
  title: string;
  colors: SearchThemeColors;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
};

export default function SearchSection({
  title,
  colors,
  children,
  rightAction,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.muted }]}>{title}</Text>
        {rightAction ? <View>{rightAction}</View> : null}
      </View>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  header: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    gap: 12,
  },
});