import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  onPressNotifications: () => void;
  onPressSettings: () => void;
  backgroundColor: string;
  textColor: string;
};

export default function ProfilePrimaryActions({
  onPressNotifications,
  onPressSettings,
  backgroundColor,
  textColor,
}: Props) {
  return (
    <View style={styles.container}>
      <Action
        label="Notificações"
        onPress={onPressNotifications}
        backgroundColor={backgroundColor}
        textColor={textColor}
      />
      <Action
        label="Configurações"
        onPress={onPressSettings}
        backgroundColor={backgroundColor}
        textColor={textColor}
      />
    </View>
  );
}

function Action({
  label,
  onPress,
  backgroundColor,
  textColor,
}: {
  label: string;
  onPress: () => void;
  backgroundColor: string;
  textColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  button: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  text: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
});