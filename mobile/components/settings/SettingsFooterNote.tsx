import React from 'react';
import { StyleSheet, Text } from 'react-native';

type Props = {
  color: string;
};

export default function SettingsFooterNote({ color }: Props) {
  return (
    <Text style={[styles.text, { color }]}>
      TRUTH OR DARE SETTINGS
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '900',
    letterSpacing: 2,
    paddingTop: 4,
    paddingBottom: 8,
  },
});