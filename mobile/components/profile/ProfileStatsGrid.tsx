import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  followers: string;
  following: string;
  truthsCreated: number;
  daresCreated: number;
};

export default function ProfileStatsGrid({
  followers,
  following,
  truthsCreated,
  daresCreated,
}: Props) {
  return (
    <View style={styles.container}>
      <Stat value={followers} label="Seguidores" />
      <Stat value={following} label="Seguindo" />
      <Stat
        value={truthsCreated === 0 ? '—' : truthsCreated}
        label="Verdades Criadas"
      />
      <Stat
        value={daresCreated === 0 ? '—' : daresCreated}
        label="Desafios Criados"
      />
    </View>
  );
}

function Stat({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#5A8363',
    borderRadius: 28,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  value: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 20,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
    textAlign: 'center',
  },
});