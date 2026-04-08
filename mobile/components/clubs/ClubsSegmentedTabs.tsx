import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ClubsThemeColors } from '../../constants/clubsTheme';
import type { ClubsTabKey } from '../../types/clubs';

type Props = {
  activeTab: ClubsTabKey;
  onChangeTab: (tab: ClubsTabKey) => void;
  colors: ClubsThemeColors;
};

const TABS: Array<{ key: ClubsTabKey; label: string }> = [
  { key: 'my-clubs', label: 'Meus Clubes' },
  { key: 'discover', label: 'Descobrir' },
];

export default function ClubsSegmentedTabs({
  activeTab,
  onChangeTab,
  colors,
}: Props) {
  return (
    <View
      style={[
        styles.container,
        {
          borderBottomColor: colors.outline,
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <Pressable
            key={tab.key}
            onPress={() => onChangeTab(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              {
                borderBottomColor: isActive ? colors.green : 'transparent',
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? colors.green : colors.muted,
                  fontWeight: isActive ? '800' : '700',
                },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 14,
    letterSpacing: 0.1,
  },
  pressed: {
    opacity: 0.88,
  },
});