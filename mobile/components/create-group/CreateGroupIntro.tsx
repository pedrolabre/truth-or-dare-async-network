import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CreateGroupThemeColors } from '../../constants/createGroupTheme';

type Props = {
  colors: CreateGroupThemeColors;
};

export default function CreateGroupIntro({ colors }: Props) {
  return (
    <View style={styles.introSection}>
      <Text style={[styles.screenTitle, { color: colors.text }]}>
        Novo Clube
      </Text>
      <Text style={[styles.screenSubtitle, { color: colors.subText }]}>
        Crie um grupo para jogar Truth or Dare com amigos.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  introSection: {
    gap: 6,
  },
  screenTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -1.1,
  },
  screenSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});