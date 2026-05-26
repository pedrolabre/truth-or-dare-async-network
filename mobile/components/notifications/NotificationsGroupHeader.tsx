import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  count: number;
  titleColor: string;
  countColor: string;
  countBackgroundColor: string;
};

export default function NotificationsGroupHeader({
  title,
  count,
  titleColor,
  countColor,
  countBackgroundColor,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { color: titleColor }]}>{title}</Text>

      <View style={[styles.countPill, { backgroundColor: countBackgroundColor }]}>
        <Text style={[styles.countText, { color: countColor }]}>{count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  countPill: {
    minWidth: 28,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
  },
});
