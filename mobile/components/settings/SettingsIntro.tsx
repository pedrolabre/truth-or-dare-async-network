import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  titleColor: string;
  subtitleColor: string;
};

export default function SettingsIntro({
  titleColor,
  subtitleColor,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { color: titleColor }]}>Configurações</Text>
      <Text style={[styles.subtitle, { color: subtitleColor }]}>
        Gerencie sua conta e preferências
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
    paddingTop: 4,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
});