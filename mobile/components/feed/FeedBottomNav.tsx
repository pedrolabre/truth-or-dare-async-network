import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavItem, BottomNavKey } from '../../types/feed';

type FeedBottomNavProps = {
  items: BottomNavItem[];
  activeKey: BottomNavKey;
  onSelect: (key: BottomNavKey) => void;
  backgroundColor: string;
  borderTopColor: string;
  activeBackgroundColor: string;
  activeIconColor: string;
  activeTextColor: string;
  inactiveIconColor: string;
  inactiveTextColor: string;
};

export default function FeedBottomNav({
  items,
  activeKey,
  onSelect,
  backgroundColor,
  borderTopColor,
  activeBackgroundColor,
  activeIconColor,
  activeTextColor,
  inactiveIconColor,
  inactiveTextColor,
}: FeedBottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor,
          borderTopColor,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <View style={styles.bottomNav}>
        {items.map((item) => {
          const isActive = item.key === activeKey;

          return (
            <Pressable
              key={item.key}
              onPress={() => onSelect(item.key)}
              style={({ pressed }) => [
                styles.navItem,
                isActive && {
                  backgroundColor: activeBackgroundColor,
                },
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons
                name={item.icon}
                size={22}
                color={isActive ? activeIconColor : inactiveIconColor}
              />
              <Text
                style={[
                  isActive ? styles.navItemActiveText : styles.navItemText,
                  {
                    color: isActive ? activeTextColor : inactiveTextColor,
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 10,
  },
  bottomNav: {
    minHeight: 64,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
  },
  navItemText: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
  },
  navItemActiveText: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
});