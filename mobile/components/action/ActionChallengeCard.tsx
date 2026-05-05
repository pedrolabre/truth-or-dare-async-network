import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ActionChallenge } from '../../types/action';

type ActionChallengeCardProps = {
  challenge: ActionChallenge;
  backgroundColor: string;
  borderColor: string;
  titleColor: string;
  descriptionColor: string;
  mutedTextColor: string;
  badgeBackgroundColor: string;
  badgeTextColor: string;
  accentColor: string;
  participantBackgroundColor: string;
  participantTextColor: string;
  extraParticipantBackgroundColor: string;
  extraParticipantTextColor: string;
};

function getStatusLabel(status: ActionChallenge['status']) {
  switch (status) {
    case 'active':
      return 'Ativo';
    case 'submitted':
      return 'Enviado';
    case 'concluded':
      return 'Concluído';
    case 'failed':
      return 'Falhou';
    case 'expired':
      return 'Expirado';
    default:
      return 'Status';
  }
}

function getTypeLabel() {
  return 'Desafio';
}

export default function ActionChallengeCard({
  challenge,
  backgroundColor,
  borderColor,
  titleColor,
  descriptionColor,
  mutedTextColor,
  badgeBackgroundColor,
  badgeTextColor,
  accentColor,
  participantBackgroundColor,
  participantTextColor,
  extraParticipantBackgroundColor,
  extraParticipantTextColor,
}: ActionChallengeCardProps) {
  const visibleParticipants = challenge.participants.slice(0, 3);
  const extraParticipantsCount = Math.max(challenge.participants.length - 3, 0);

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
      <View style={styles.topRow}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: badgeBackgroundColor,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: badgeTextColor }]}>
            {getTypeLabel()}
          </Text>
        </View>

        <View style={styles.statusWrap}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: accentColor,
              },
            ]}
          />
          <Text style={[styles.statusText, { color: mutedTextColor }]}>
            {getStatusLabel(challenge.status)}
          </Text>
        </View>
      </View>

      <Text style={[styles.title, { color: titleColor }]}>{challenge.title}</Text>

      {challenge.description ? (
        <Text style={[styles.description, { color: descriptionColor }]}>
          {challenge.description}
        </Text>
      ) : null}

      <View style={styles.metaSection}>
        <View style={styles.metaRow}>
          <MaterialIcons name="person-outline" size={16} color={mutedTextColor} />
          <Text style={[styles.metaText, { color: mutedTextColor }]}>
            Criado por {challenge.creatorName}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <MaterialIcons name="schedule" size={16} color={mutedTextColor} />
          <Text style={[styles.metaText, { color: mutedTextColor }]}>
            {challenge.createdAtLabel}
          </Text>
        </View>

        {challenge.timeRemainingLabel ? (
          <View style={styles.metaRow}>
            <MaterialIcons name="hourglass-bottom" size={16} color={mutedTextColor} />
            <Text style={[styles.metaText, { color: mutedTextColor }]}>
              {challenge.timeRemainingLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.participantsSection}>
        <Text style={[styles.participantsLabel, { color: titleColor }]}>
          Participantes
        </Text>

        <View style={styles.participantsRow}>
          {visibleParticipants.map((participant) => (
            <View
              key={participant.id}
              style={[
                styles.participantChip,
                { backgroundColor: participantBackgroundColor },
              ]}
            >
              <View
                style={[
                  styles.participantAvatar,
                  { backgroundColor: accentColor },
                ]}
              >
                <Text
                  style={[
                    styles.participantAvatarText,
                    { color: participantTextColor },
                  ]}
                >
                  {participant.initials}
                </Text>
              </View>

              <Text
                numberOfLines={1}
                style={[styles.participantName, { color: titleColor }]}
              >
                {participant.name}
              </Text>
            </View>
          ))}

          {extraParticipantsCount > 0 ? (
            <View
              style={[
                styles.extraParticipantsChip,
                { backgroundColor: extraParticipantBackgroundColor },
              ]}
            >
              <Text
                style={[
                  styles.extraParticipantsText,
                  { color: extraParticipantTextColor },
                ]}
              >
                +{extraParticipantsCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  metaSection: {
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  participantsSection: {
    gap: 12,
  },
  participantsLabel: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  participantsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  participantChip: {
    minHeight: 40,
    maxWidth: '100%',
    borderRadius: 999,
    paddingLeft: 6,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarText: {
    fontSize: 10,
    fontWeight: '900',
  },
  participantName: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  extraParticipantsChip: {
    minHeight: 40,
    minWidth: 40,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraParticipantsText: {
    fontSize: 12,
    fontWeight: '900',
  },
});