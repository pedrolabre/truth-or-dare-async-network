import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ClubsThemeColors } from '../../constants/clubsTheme';
import type { ClubDetailTabKey } from '../../types/clubs';

type Props = {
  activeTab: ClubDetailTabKey;
  colors: ClubsThemeColors;
  onChangeTab: (tab: ClubDetailTabKey) => void;
};

type TabItem = {
  key: ClubDetailTabKey;
  label: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
};

const TABS: TabItem[] = [
  { key: 'feed', label: 'Feed', iconName: 'dynamic-feed' },
  { key: 'members', label: 'Membros', iconName: 'groups' },
  { key: 'ranking', label: 'Ranking', iconName: 'emoji-events' },
  { key: 'about', label: 'Sobre', iconName: 'info-outline' },
];

export default function ClubDetailTabs({
  activeTab,
  colors,
  onChangeTab,
}: Props) {
  return (
    <View
      testID="club-detail-tabs"
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        const contentColor = isActive ? colors.white : colors.muted;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Abrir aba ${tab.label}`}
            testID={`club-detail-tab-${tab.key}`}
            onPress={() => onChangeTab(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              {
                backgroundColor: isActive ? colors.green : 'transparent',
              },
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name={tab.iconName} size={17} color={contentColor} />
            <Text
              numberOfLines={1}
              style={[styles.label, { color: contentColor }]}
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
    borderRadius: 22,
    borderWidth: 1,
    padding: 6,
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  label: {
    maxWidth: '100%',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.88,
  },
});
