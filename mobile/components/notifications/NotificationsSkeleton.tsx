import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  backgroundColor: string;
  borderColor: string;
  softColor: string;
};

export default function NotificationsSkeleton({
  backgroundColor,
  borderColor,
  softColor,
}: Props) {
  return (
    <View testID="notifications-skeleton" style={styles.list}>
      {[0, 1, 2].map((item) => (
        <View
          key={item}
          testID="notifications-skeleton-card"
          style={[styles.card, { backgroundColor, borderColor }]}
        >
          <View style={[styles.icon, { backgroundColor: softColor }]} />
          <View style={styles.content}>
            <View style={[styles.lineLarge, { backgroundColor: softColor }]} />
            <View style={[styles.line, { backgroundColor: softColor }]} />
            <View style={[styles.lineSmall, { backgroundColor: softColor }]} />
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
    minHeight: 102,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    gap: 14,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  content: {
    flex: 1,
    gap: 10,
    paddingTop: 3,
  },
  lineLarge: {
    width: '70%',
    height: 16,
    borderRadius: 8,
  },
  line: {
    width: '92%',
    height: 12,
    borderRadius: 6,
  },
  lineSmall: {
    width: '45%',
    height: 12,
    borderRadius: 6,
  },
});
