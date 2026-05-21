import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ClubsThemeColors } from '../../constants/clubsTheme';

type Props = {
  colors: ClubsThemeColors;
  onPress?: () => void;
};

export default function ClubsFab({
  colors,
  onPress,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          bottom: Math.max(insets.bottom, 8) + 84,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Criar grupo"
        testID="clubs-create-group-button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: colors.red,
            shadowColor: '#000000',
          },
          pressed && styles.pressed,
        ]}
      >
        <MaterialIcons name="add" size={22} color={colors.white} />
        <Text style={[styles.buttonText, { color: colors.white }]}>
          Criar grupo
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 20,
  },
  button: {
    minHeight: 52,
    borderRadius: 999,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  buttonText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
});
