import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SearchThemeColors } from '../../constants/searchTheme';

type Props = {
  colors: SearchThemeColors;
  message: string;
  onRetry: () => void;
  title?: string;
};

export default function SearchErrorState({
  colors,
  message,
  onRetry,
  title = 'Nao foi possivel buscar agora',
}: Props) {
  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${message}`}
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.redSoft },
        ]}
      >
        <MaterialIcons name="wifi-off" size={22} color={colors.red} />
      </View>

      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.message, { color: colors.subText }]}>
          {message}
        </Text>
      </View>

      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Tentar buscar novamente"
        hitSlop={8}
        style={({ pressed }) => [
          styles.retryButton,
          { backgroundColor: colors.red },
          pressed && styles.pressed,
        ]}
      >
        <MaterialIcons name="refresh" size={18} color={colors.white} />
        <Text style={[styles.retryText, { color: colors.white }]}>
          Tentar novamente
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    gap: 6,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
});
