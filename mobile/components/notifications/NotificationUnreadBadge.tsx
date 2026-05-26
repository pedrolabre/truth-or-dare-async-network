import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type NotificationUnreadBadgeProps = {
  count?: number | null;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
  testID?: string;
};

export function formatNotificationUnreadBadgeCount(
  count?: number | null,
): string | null {
  if (typeof count !== 'number' || !Number.isFinite(count) || count <= 0) {
    return null;
  }

  const normalizedCount = Math.floor(count);

  if (normalizedCount <= 0) {
    return null;
  }

  if (normalizedCount > 99) {
    return '99+';
  }

  return String(normalizedCount);
}

export default function NotificationUnreadBadge({
  count,
  backgroundColor,
  textColor,
  borderColor = 'transparent',
  testID = 'notifications-unread-badge',
}: NotificationUnreadBadgeProps) {
  const label = formatNotificationUnreadBadgeCount(count);

  if (!label) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.badge, { backgroundColor, borderColor }]}
      testID={testID}
    >
      <Text numberOfLines={1} style={[styles.text, { color: textColor }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 0,
    right: -3,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
  },
});
