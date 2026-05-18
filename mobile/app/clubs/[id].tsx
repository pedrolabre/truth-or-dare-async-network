import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../context/ThemeContext';
import {
  DARK_CLUBS_COLORS,
  LIGHT_CLUBS_COLORS,
} from '../../constants/clubsTheme';

type ClubDetailRouteParams = {
  id?: string | string[];
};

function getParamValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default function ClubDetailShellScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<ClubDetailRouteParams>();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = isDark ? DARK_CLUBS_COLORS : LIGHT_CLUBS_COLORS;
  const clubId = getParamValue(params.id);

  return (
    <View style={[styles.root, { backgroundColor: colors.green }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.green}
      />

      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 12),
              backgroundColor: colors.green,
              borderBottomColor: colors.cardBorder,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={10}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name="arrow-back" size={23} color={colors.white} />
          </Pressable>

          <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.white }]}>
            Clube
          </Text>

          <View style={styles.iconButton} />
        </View>

        <View style={styles.content}>
          <View
            style={[
              styles.shellCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={[styles.clubIcon, { backgroundColor: colors.green }]}>
              <MaterialIcons name="groups" size={30} color={colors.white} />
            </View>

            <View style={styles.textStack}>
              <Text style={[styles.title, { color: colors.text }]}>
                Detalhe do clube
              </Text>
              <Text
                testID="club-detail-id"
                style={[styles.clubId, { color: colors.subText }]}
              >
                {clubId ? `ID: ${clubId}` : 'ID nao informado'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  header: {
    minHeight: 88,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  shellCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  clubIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStack: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  clubId: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
  },
});
