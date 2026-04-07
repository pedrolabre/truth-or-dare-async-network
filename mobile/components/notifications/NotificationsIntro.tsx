import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  allRead: boolean;
  titleColor: string;
  actionColor: string;
  disabledColor: string;
  onPressMarkAllRead: () => void;
};

export default function NotificationsIntro({
  allRead,
  titleColor,
  actionColor,
  disabledColor,
  onPressMarkAllRead,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { color: titleColor }]}>Atividade</Text>

      <Pressable
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
          {allRead ? 'Tudo lido' : 'Marcar tudo como lido'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  actionWrap: {
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});