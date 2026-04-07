import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  textColor: string;
  subTextColor: string;
};

export default function ProfileAchievements({
  textColor,
  subTextColor,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { color: textColor }]}>
        Minhas conquistas
      </Text>

      {/* estado vazio preparado para backend */}
      <View style={styles.emptyState}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="emoji-events" size={28} color={subTextColor} />
        </View>

        <Text style={[styles.emptyTitle, { color: textColor }]}>
          Nenhuma conquista ainda
        </Text>

        <Text style={[styles.emptyText, { color: subTextColor }]}>
          Complete desafios e interaja no app para desbloquear conquistas.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 14,
  },

  title: {
    fontSize: 18,
    fontWeight: '900',
  },

  emptyState: {
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },

  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },

  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 260,
  },
});