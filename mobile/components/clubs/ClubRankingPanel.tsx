import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ClubsThemeColors } from '../../constants/clubsTheme';

type Props = {
  colors: ClubsThemeColors;
};

export default function ClubRankingPanel({ colors }: Props) {
  return (
    <View
      testID="club-ranking-unavailable"
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.greenSoft }]}>
        <MaterialIcons name="photo-library" size={30} color={colors.green} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        Mídias indisponíveis
      </Text>
      <Text style={styles.hiddenText}>Ranking indisponivel</Text>

      <Text style={[styles.description, { color: colors.subText }]}>
        Fotos e vídeos do clube dependem de uma fonte real de mídias. Nenhuma
        galeria local é exibida aqui.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  description: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    maxWidth: 292,
  },
  hiddenText: {
    position: 'absolute',
    opacity: 0,
  },
});
