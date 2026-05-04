import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ActionChallenge } from '../../types/action';

type ActionMetaProps = {
  challenge: ActionChallenge;
  progressValue: number;
  backgroundColor: string;
  borderColor: string;
  labelColor: string;
  valueColor: string;
  accentColor: string;
  trackColor: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
};

function getStatusSummary(status: ActionChallenge['status']) {
  switch (status) {
    case 'pending':
      return 'Aguardando início';
    case 'active':
      return 'Desafio em andamento';
    case 'submitted':
      return 'Prova enviada';
    case 'concluded':
      return 'Desafio concluído';
    case 'failed':
      return 'Desafio falhou';
    case 'expired':
      return 'Prazo encerrado';
    default:
      return 'Status indisponível';
  }
}

function getStatusColor(
  status: ActionChallenge['status'],
  successColor: string,
  warningColor: string,
  dangerColor: string,
  accentColor: string,
) {
  switch (status) {
    case 'submitted':
    case 'concluded':
      return successColor;
    case 'pending':
      return warningColor;
    case 'failed':
    case 'expired':
      return dangerColor;
    case 'active':
    default:
      return accentColor;
  }
}

export default function ActionMeta({
  challenge,
  progressValue,
  backgroundColor,
  borderColor,
  labelColor,
  valueColor,
  accentColor,
  trackColor,
  successColor,
  warningColor,
  dangerColor,
}: ActionMetaProps) {
  const attemptsUsed = challenge.attemptsUsed ?? 0;
  const maxAttempts = challenge.maxAttempts ?? 0;
  const attemptsLabel =
    maxAttempts > 0 ? `${attemptsUsed}/${maxAttempts}` : 'Sem limite';

  const statusColor = getStatusColor(
    challenge.status,
    successColor,
    warningColor,
    dangerColor,
    accentColor,
  );

  const proofLabel =
    challenge.existingProofCount > 0
      ? `${challenge.existingProofCount} prova(s)`
      : 'Nenhuma prova enviada';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <View style={styles.grid}>
        <View style={styles.metaItem}>
          <View style={styles.labelRow}>
            <MaterialIcons name="repeat" size={16} color={labelColor} />
            <Text style={[styles.label, { color: labelColor }]}>Tentativas</Text>
          </View>
          <Text style={[styles.value, { color: valueColor }]}>{attemptsLabel}</Text>
        </View>

        <View style={styles.metaItem}>
          <View style={styles.labelRow}>
            <MaterialIcons name="schedule" size={16} color={labelColor} />
            <Text style={[styles.label, { color: labelColor }]}>Prazo</Text>
          </View>
          <Text style={[styles.value, { color: valueColor }]}>
            {challenge.expiresAtLabel ?? 'Sem prazo'}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <View style={styles.labelRow}>
            <MaterialIcons name="verified" size={16} color={labelColor} />
            <Text style={[styles.label, { color: labelColor }]}>Status</Text>
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: statusColor,
                },
              ]}
            />
            <Text style={[styles.value, { color: valueColor }]}>
              {getStatusSummary(challenge.status)}
            </Text>
          </View>
        </View>

        <View style={styles.metaItem}>
          <View style={styles.labelRow}>
            <MaterialIcons name="perm-media" size={16} color={labelColor} />
            <Text style={[styles.label, { color: labelColor }]}>Provas</Text>
          </View>
          <Text style={[styles.value, { color: valueColor }]}>{proofLabel}</Text>
        </View>
      </View>

      {challenge.maxAttempts ? (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: labelColor }]}>
              Progresso de tentativas
            </Text>
            <Text style={[styles.progressValue, { color: valueColor }]}>
              {Math.round(progressValue * 100)}%
            </Text>
          </View>

          <View
            style={[
              styles.track,
              {
                backgroundColor: trackColor,
              },
            ]}
          >
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.max(0, Math.min(progressValue, 1)) * 100}%`,
                  backgroundColor: accentColor,
                },
              ]}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 18,
  },
  grid: {
    gap: 16,
  },
  metaItem: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  progressSection: {
    gap: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '900',
  },
  track: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});