import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  colors: {
    cardBackground: string;
    text: string;
    textMuted: string;
    primary: string;
    white: string;
  };
};

export default function RecoveryIllustrationCard({
  icon,
  title,
  subtitle,
  colors,
}: Props) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: colors.primary,
          },
        ]}
      >
        <MaterialIcons name={icon} size={36} color={colors.white} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
});