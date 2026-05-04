import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ProofDetailItem } from '../../types/proof';

type ProofDetailContentProps = {
  proof: ProofDetailItem;
  backgroundColor: string;
  borderColor: string;
  titleColor: string;
  descriptionColor: string;
  metaColor: string;
  accentColor: string;
  accentSoftColor: string;
};

export default function ProofDetailContent({
  proof,
  backgroundColor,
  borderColor,
  titleColor,
  descriptionColor,
  metaColor,
  accentColor,
  accentSoftColor,
}: ProofDetailContentProps) {
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
      {/* Autor + data */}
      <View style={styles.authorRow}>
        <View style={[styles.avatar, { backgroundColor: accentColor }]}>
          <Text style={styles.avatarText}>{proof.author.initials}</Text>
        </View>

        <View style={styles.authorInfo}>
          <Text style={[styles.authorName, { color: titleColor }]}>
            {proof.author.name}
          </Text>

          <View style={styles.metaRow}>
            <MaterialIcons name="schedule" size={14} color={metaColor} />
            <Text style={[styles.metaText, { color: metaColor }]}>
              {proof.createdAtLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* Challenge relacionado */}
      <View
        style={[
          styles.challengeCard,
          {
            backgroundColor: accentSoftColor,
          },
        ]}
      >
        <View style={styles.challengeHeader}>
          <Text style={[styles.challengeType, { color: accentColor }]}>
            {proof.challengeType.toUpperCase()}
          </Text>

          {proof.relatedChallenge.statusLabel ? (
            <Text style={[styles.challengeStatus, { color: metaColor }]}>
              {proof.relatedChallenge.statusLabel}
            </Text>
          ) : null}
        </View>

        <Text style={[styles.challengeTitle, { color: titleColor }]}>
          {proof.relatedChallenge.title}
        </Text>
      </View>

      {/* Descrição */}
      <View style={styles.descriptionBlock}>
        <Text style={[styles.description, { color: descriptionColor }]}>
          {proof.description}
        </Text>
      </View>

      {/* Métricas */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <MaterialIcons name="favorite-border" size={18} color={metaColor} />
          <Text style={[styles.metricText, { color: metaColor }]}>
            {proof.likesCount}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <MaterialIcons name="chat-bubble-outline" size={18} color={metaColor} />
          <Text style={[styles.metricText, { color: metaColor }]}>
            {proof.commentsCount}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },

  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },

  authorInfo: {
    flex: 1,
    gap: 4,
  },

  authorName: {
    fontSize: 15,
    fontWeight: '800',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },

  challengeCard: {
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },

  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  challengeType: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  challengeStatus: {
    fontSize: 11,
    fontWeight: '700',
  },

  challengeTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },

  descriptionBlock: {
    marginTop: 2,
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },

  metricsRow: {
    flexDirection: 'row',
    gap: 18,
  },

  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  metricText: {
    fontSize: 13,
    fontWeight: '700',
  },
});