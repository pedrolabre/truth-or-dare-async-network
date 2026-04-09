import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  color: string;
  style?: ViewStyle;
};

export default function RecoverySecondaryLink({
  label,
  onPress,
  color,
  style,
}: Props) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={[styles.pressable, style]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'center',
  },
  label: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textDecorationLine: 'underline',
  },
});