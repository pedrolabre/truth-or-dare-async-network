import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ProofDetailHeaderProps = {
  title?: string;
  backgroundColor: string;
  titleColor: string;
  iconColor: string;
  borderBottomColor: string;
  onPressBack?: () => void;
  onPressMenu?: () => void;
};

export default function ProofDetailHeader({
  title = 'Visualizar prova',
  backgroundColor,
  titleColor,
  iconColor,
  borderBottomColor,
  onPressBack,
  onPressMenu,
}: ProofDetailHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  function handleBack() {
    if (onPressBack) {
      onPressBack();
      return;
    }

    router.back();
  }

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
        <Pressable
          hitSlop={10}
          onPress={handleBack}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name="arrow-back" size={24} color={iconColor} />
        </Pressable>

        <View style={styles.titleWrap}>
          <Text numberOfLines={1} style={[styles.title, { color: titleColor }]}>
            {title}
          </Text>
        </View>

        <Pressable
          hitSlop={10}
          onPress={onPressMenu}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name="more-vert" size={24} color={iconColor} />
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
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
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});