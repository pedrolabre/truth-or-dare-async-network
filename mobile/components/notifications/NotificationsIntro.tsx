import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  allRead: boolean;
  titleColor: string;
  subtitleColor: string;
  actionColor: string;
  disabledColor: string;
  onPressMarkAllRead: () => void;
};

export default function NotificationsIntro({
  allRead,
  titleColor,
  subtitleColor,
  actionColor,
  disabledColor,
  onPressMarkAllRead,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: titleColor }]}>Sua atividade</Text>

        <Text style={[styles.subtitle, { color: subtitleColor }]}>
          Avisos de clubes, feed e conta ficam reunidos aqui.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: allRead }}
        onPress={onPressMarkAllRead}
        disabled={allRead}
        style={({ pressed }) => [
          styles.actionWrap,
          pressed && !allRead && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.actionText,
            { color: allRead ? disabledColor : actionColor },
          ]}
        >
          {allRead ? 'Tudo em dia' : 'Marcar todas como lidas'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  actionWrap: {
    minHeight: 44,
    minWidth: 44,
    maxWidth: 158,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    textAlign: 'right',
  },
  pressed: {
    opacity: 0.8,
  },
});
