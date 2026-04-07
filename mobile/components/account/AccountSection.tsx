import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  titleColor: string;
  children: React.ReactNode;
};

export default function AccountSection({
  title,
  titleColor,
  children,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 2,
  },
  content: {
    gap: 10,
  },
});