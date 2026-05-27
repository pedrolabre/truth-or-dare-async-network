import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type NotificationAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

type Props = {
  title: string;
  description: string;
  timeLabel: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBackgroundColor: string;
  backgroundColor: string;
  borderColor: string;
  titleColor: string;
  textColor: string;
  timeColor: string;
  unread?: boolean;
  unreadAccentColor?: string;
  actions?: NotificationAction[];
  onPress?: () => void;
};

export default function NotificationActivityCard({
  title,
  description,
  timeLabel,
  icon,
  iconColor,
  iconBackgroundColor,
  backgroundColor,
  borderColor,
  titleColor,
  textColor,
  timeColor,
  unread = false,
  unreadAccentColor = '#B42318',
  actions,
  onPress,
}: Props) {
  const unreadStyle = unread
    ? {
        borderLeftWidth: 4,
        borderLeftColor: unreadAccentColor,
      }
    : null;
  const rootStyle = [
    styles.card,
    {
      backgroundColor,
      borderColor,
    },
    unreadStyle,
  ];
  const accessibilityLabel = [
    title,
    description,
    timeLabel,
    unread ? 'Nao lida' : undefined,
  ]
    .filter(Boolean)
    .join('. ');

  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: iconBackgroundColor }]}>
        <MaterialIcons name={icon} size={24} color={iconColor} />
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: titleColor }]} numberOfLines={2}>
            {title}
          </Text>

          <View style={styles.metaRow}>
            {unread && (
              <View
                accessibilityElementsHidden
                importantForAccessibility="no"
                style={[
                  styles.unreadDot,
                  { backgroundColor: unreadAccentColor },
                ]}
              />
            )}

            <Text style={[styles.time, { color: timeColor }]}>
              {timeLabel}
            </Text>
          </View>
        </View>

        <Text
          style={[styles.description, { color: textColor }]}
          numberOfLines={3}
        >
          {description}
        </Text>

        {actions && actions.length > 0 && (
          <View style={styles.actionsRow}>
            {actions.map((action) => {
              const isPrimary = action.variant === 'primary';

              return (
                <Pressable
                  key={action.label}
                  accessibilityRole="button"
                  onPress={action.onPress}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.actionButton,
                    isPrimary ? styles.primaryButton : styles.secondaryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.actionText,
                      isPrimary
                        ? styles.primaryText
                        : styles.secondaryText,
                    ]}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [
          ...rootStyle,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View accessibilityLabel={accessibilityLabel} style={rootStyle}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 92,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  metaRow: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  title: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },
  time: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    flexShrink: 0,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  actionButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#B42318',
  },
  secondaryButton: {
    backgroundColor: '#3F6B4A',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '900',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
