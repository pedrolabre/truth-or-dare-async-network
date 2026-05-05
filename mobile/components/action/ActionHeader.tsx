import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ActionChallengeType } from '../../types/action';

type ActionHeaderProps = {
  title?: string;
  challengeType: ActionChallengeType;
  backgroundColor: string;
  titleColor: string;
  iconColor: string;
  borderBottomColor: string;
  onPressCancel: () => void;
};

export default function ActionHeader({
  title,
  challengeType,
  backgroundColor,
  titleColor,
  iconColor,
  borderBottomColor,
  onPressCancel,
}: ActionHeaderProps) {
  const insets = useSafeAreaInsets();

  const resolvedTitle = title ?? 'Fazer prova';

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor,
          borderBottomColor,
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.sideSpacer} />

        <View style={styles.titleWrap}>
          <Text numberOfLines={1} style={[styles.title, { color: titleColor }]}>
            {resolvedTitle}
          </Text>
        </View>

        <Pressable
          hitSlop={10}
          onPress={onPressCancel}
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.cancelText, { color: iconColor }]}>
            Cancelar
          </Text>
          <MaterialIcons name="close" size={18} color={iconColor} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
  },
  header: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sideSpacer: {
    width: 86,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  cancelButton: {
    minWidth: 86,
    height: 40,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});