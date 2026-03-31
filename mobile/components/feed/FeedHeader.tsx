import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FeedHeaderProps = {
  title: string;
  initials: string;
  headerGreen: string;
  white: string;
  surfaceContainer: string;
  borderBottomColor: string;
  avatarBorderColor: string;
  avatarBackgroundColor: string;
  onPressNotifications?: () => void;
};

export default function FeedHeader({
  title,
  initials,
  headerGreen,
  white,
  surfaceContainer,
  borderBottomColor,
  avatarBorderColor,
  avatarBackgroundColor,
  onPressNotifications,
}: FeedHeaderProps) {
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.headerAvatarWrap,
              {
                backgroundColor: avatarBackgroundColor || surfaceContainer,
                borderColor: avatarBorderColor,
              },
            ]}
          >
            <Text style={[styles.headerAvatarText, { color: white }]}>{initials}</Text>
          </View>

          <Text
            numberOfLines={1}
            style={[styles.headerTitle, { color: white }]}
          >
            {title}
          </Text>
        </View>

        <Pressable
          hitSlop={8}
          style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
          onPress={onPressNotifications}
        >
          <MaterialIcons name="notifications-none" size={24} color={white} />
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  headerAvatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerAvatarText: {
    fontSize: 12,
    fontWeight: '800',
  },
  headerTitle: {
    flexShrink: 1,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});