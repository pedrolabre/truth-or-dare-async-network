import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ClubsThemeColors } from '../../constants/clubsTheme';

type Props = {
  colors: ClubsThemeColors;
  onPress?: () => void;
};

export default function ClubsFab({
  colors,
  onPress,
}: Props) {
  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <Pressable
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
        <MaterialIcons name="add" size={30} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 20,
    bottom: 24,
  },
  button: {
    width: 62,
    height: 62,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
});