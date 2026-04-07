import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title: string;
  headerGreen: string;
  titleColor: string;
  borderBottomColor?: string;
  leftIcon?: keyof typeof MaterialIcons.glyphMap;
  onPressLeft?: () => void;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onPressRight?: () => void;
};

export default function AccountScreenHeader({
  title,
  headerGreen,
  titleColor,
  borderBottomColor = 'transparent',
  leftIcon,
  onPressLeft,
  rightIcon,
  onPressRight,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: headerGreen,
          borderBottomColor,
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.side, styles.sideLeft]}>
          {leftIcon ? (
            <Pressable
              hitSlop={8}
              onPress={onPressLeft}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons name={leftIcon} size={22} color={titleColor} />
            </Pressable>
          ) : (
            <View style={styles.iconSpacer} />
          )}
        </View>

        <Text numberOfLines={1} style={[styles.title, { color: titleColor }]}>
          {title}
        </Text>

        <View style={[styles.side, styles.sideRight]}>
          {rightIcon ? (
            <Pressable
              hitSlop={8}
              onPress={onPressRight}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons name={rightIcon} size={22} color={titleColor} />
            </Pressable>
          ) : (
            <View style={styles.iconSpacer} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
  },
  content: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    width: 40,
    justifyContent: 'center',
  },
  sideLeft: {
    alignItems: 'flex-start',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacer: {
    width: 36,
    height: 36,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});