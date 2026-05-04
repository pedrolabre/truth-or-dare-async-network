import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type ActionFooterProps = {
  primaryLabel: string;
  secondaryLabel?: string;
  primaryDisabled?: boolean;
  secondaryDisabled?: boolean;
  backgroundColor: string;
  borderTopColor: string;
  primaryBackgroundColor: string;
  primaryTextColor: string;
  secondaryBackgroundColor: string;
  secondaryTextColor: string;
  onPressPrimary: () => void;
  onPressSecondary?: () => void;
  bottomInset?: number;
};

export default function ActionFooter({
  primaryLabel,
  secondaryLabel,
  primaryDisabled = false,
  secondaryDisabled = false,
  backgroundColor,
  borderTopColor,
  primaryBackgroundColor,
  primaryTextColor,
  secondaryBackgroundColor,
  secondaryTextColor,
  onPressPrimary,
  onPressSecondary,
  bottomInset = 0,
}: ActionFooterProps) {
  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor,
          borderTopColor,
          paddingBottom: Math.max(bottomInset, 12),
        },
      ]}
    >
      <View style={styles.actions}>
        {secondaryLabel && onPressSecondary ? (
          <Pressable
            disabled={secondaryDisabled}
            onPress={onPressSecondary}
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: secondaryBackgroundColor },
              secondaryDisabled && styles.disabled,
              pressed && !secondaryDisabled && styles.pressed,
            ]}
          >
            <MaterialIcons name="visibility" size={18} color={secondaryTextColor} />
            <Text
              numberOfLines={1}
              style={[styles.secondaryButtonText, { color: secondaryTextColor }]}
            >
              {secondaryLabel}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          disabled={primaryDisabled}
          onPress={onPressPrimary}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: primaryBackgroundColor },
            primaryDisabled && styles.disabled,
            pressed && !primaryDisabled && styles.pressed,
          ]}
        >
          <MaterialIcons name="send" size={18} color={primaryTextColor} />
          <Text
            numberOfLines={1}
            style={[styles.primaryButtonText, { color: primaryTextColor }]}
          >
            {primaryLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  primaryButton: {
    flex: 1.2,
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});