import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  message: string;
  backgroundColor: string;
  borderColor: string;
  iconBackgroundColor: string;
  iconColor: string;
  titleColor: string;
  textColor: string;
  actionBackgroundColor: string;
  actionTextColor: string;
  onRetry: () => void;
};

export default function NotificationsErrorState({
  message,
  backgroundColor,
  borderColor,
  iconBackgroundColor,
  iconColor,
  titleColor,
  textColor,
  actionBackgroundColor,
  actionTextColor,
  onRetry,
}: Props) {
  return (
    <View style={[styles.card, { backgroundColor, borderColor }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBackgroundColor }]}>
        <MaterialIcons name="error-outline" size={30} color={iconColor} />
      </View>

      <Text style={[styles.title, { color: titleColor }]}>
        Nao foi possivel carregar as notificacoes
      </Text>

      <Text style={[styles.text, { color: textColor }]}>{message}</Text>

      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [
          styles.retryButton,
          { backgroundColor: actionBackgroundColor },
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.retryText, { color: actionTextColor }]}>
          Recarregar notificacoes
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 320,
  },
  retryButton: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  retryText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
});
