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
  unreadAccentColor = '#D70015',
  actions,
}: Props) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor,
        },
        unread && {
          borderLeftWidth: 4,
          borderLeftColor: unreadAccentColor,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBackgroundColor }]}>
        <MaterialIcons name={icon} size={24} color={iconColor} />
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: titleColor }]} numberOfLines={2}>
            {title}
          </Text>

          <Text style={[styles.time, { color: timeColor }]}>
            {timeLabel}
          </Text>
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
                  onPress={action.onPress}
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
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
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#D70015',
  },
  secondaryButton: {
    backgroundColor: '#5A8363',
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