import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ClubsThemeColors } from '../../constants/clubsTheme';
import type { ClubDetailTabKey } from '../../types/clubs';

type Props = {
  activeTab: ClubDetailTabKey;
  colors: ClubsThemeColors;
  showAudit?: boolean;
  onChangeTab: (tab: ClubDetailTabKey) => void;
};

type TabItem = {
  key: ClubDetailTabKey;
  label: string;
};

const TABS: TabItem[] = [
  { key: 'feed', label: 'Mural' },
  { key: 'members', label: 'Membros' },
  { key: 'media', label: 'Mídias' },
  { key: 'about', label: 'Sobre' },
];

export default function ClubDetailTabs({
  activeTab,
  colors,
  showAudit = false,
  onChangeTab,
}: Props) {
  const tabs = showAudit
    ? [...TABS, { key: 'audit' as const, label: 'Auditoria' }]
    : TABS;

  return (
    <View
      testID="club-detail-tabs"
      style={[
        styles.container,
        {
          borderColor: colors.cardBorder,
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        const contentColor = isActive ? colors.green : colors.muted;

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
                borderBottomColor: isActive ? colors.green : 'transparent',
              },
              pressed && styles.pressed,
            ]}
          >
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
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    borderBottomWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  label: {
    maxWidth: '100%',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.88,
  },
});
