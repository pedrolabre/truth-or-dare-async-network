import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ClubsThemeColors } from '../../constants/clubsTheme';

type Props = {
  colors: ClubsThemeColors;
  title?: string;
  description?: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
};

export default function ClubsEmptyState({
  colors,
  title = 'Nenhum clube encontrado',
  description = 'Tente outro termo ou volte mais tarde para explorar novos clubes.',
  iconName = 'groups',
  actionLabel,
  onAction,
}: Props) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.surfaceSoft },
        ]}
      >
        <MaterialIcons name={iconName} size={28} color={colors.muted} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      <Text style={[styles.description, { color: colors.subText }]}>
        {description}
      </Text>

      {actionLabel && onAction ? (
        <Pressable
          testID="clubs-empty-state-action"
          onPress={onAction}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: colors.green },
            pressed && styles.actionButtonPressed,
          ]}
        >
          <Text style={[styles.actionText, { color: colors.white }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  description: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    maxWidth: 280,
  },
  actionButton: {
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPressed: {
    opacity: 0.9,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '900',
  },
});
