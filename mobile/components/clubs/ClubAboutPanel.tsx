import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ClubsThemeColors } from '../../constants/clubsTheme';
import type { ClubDetail } from '../../types/clubs';
import type { ClubJoinPolicyApi } from '../../types/clubsApi';

type Props = {
  club: ClubDetail;
  colors: ClubsThemeColors;
};

type SectionProps = {
  colors: ClubsThemeColors;
  iconName: keyof typeof MaterialIcons.glyphMap;
  title: string;
  children: React.ReactNode;
};

type InfoRowProps = {
  colors: ClubsThemeColors;
  label: string;
  value: string;
};

function getJoinPolicyLabel(joinPolicy: ClubJoinPolicyApi): string {
  if (joinPolicy === 'open') {
    return 'Entrada aberta';
  }

  if (joinPolicy === 'approval_required') {
    return 'Entrada por aprovacao';
  }

  return 'Apenas convite';
}

function getDateLabel(value: string | null): string {
  if (!value) {
    return 'Nao informado';
  }

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (!dateMatch) {
    return value;
  }

  const [, year, month, day] = dateMatch;

  return `${day}/${month}/${year}`;
}

function getDescriptionText(club: ClubDetail): string {
  const description = club.descriptionText.trim();

  return description || 'Sem descricao publicada.';
}

function getRulesText(club: ClubDetail): string {
  const rules = club.rules?.trim();

  return rules || 'Sem regras publicadas.';
}

export default function ClubAboutPanel({ club, colors }: Props) {
  const tags = club.tags.map((tag) => tag.trim()).filter(Boolean);

  return (
    <View
      testID="club-about-panel"
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <Section colors={colors} iconName="notes" title="Descricao">
        <Text
          testID="club-about-description"
          style={[styles.bodyText, { color: colors.subText }]}
        >
          {getDescriptionText(club)}
        </Text>
      </Section>

      <Section colors={colors} iconName="rule" title="Regras">
        <Text
          testID="club-about-rules"
          style={[styles.bodyText, { color: colors.subText }]}
        >
          {getRulesText(club)}
        </Text>
      </Section>

      <Section colors={colors} iconName="sell" title="Tags">
        {tags.length > 0 ? (
          <View testID="club-about-tags" style={styles.tagsGrid}>
            {tags.map((tag, index) => (
              <View
                key={`${tag}-${index}`}
                style={[
                  styles.tagChip,
                  {
                    backgroundColor: colors.surfaceSoft,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.tagText, { color: colors.subText }]}
                >
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text
            testID="club-about-tags-empty"
            style={[styles.bodyText, { color: colors.subText }]}
          >
            Sem tags publicadas.
          </Text>
        )}
      </Section>

      <Section colors={colors} iconName="fact-check" title="Dados do clube">
        <View style={styles.infoStack}>
          <InfoRow colors={colors} label="Privacidade" value={club.visibilityLabel} />
          <InfoRow colors={colors} label="Status" value={club.statusLabel} />
          <InfoRow
            colors={colors}
            label="Entrada"
            value={getJoinPolicyLabel(club.joinPolicy)}
          />
          <InfoRow colors={colors} label="Seu papel" value={club.membershipLabel} />
          <InfoRow colors={colors} label="Membros" value={club.membersLabel} />
          <InfoRow colors={colors} label="Prompts" value={club.promptsLabel} />
          <InfoRow
            colors={colors}
            label="Criado em"
            value={getDateLabel(club.createdAt)}
          />
          <InfoRow
            colors={colors}
            label="Atualizado em"
            value={getDateLabel(club.updatedAt)}
          />
          <InfoRow
            colors={colors}
            label="Ultima atividade"
            value={
              club.lastActivityAt
                ? getDateLabel(club.lastActivityAt)
                : 'Sem atividade registrada'
            }
          />
          {club.archivedAt ? (
            <InfoRow
              colors={colors}
              label="Arquivado em"
              value={getDateLabel(club.archivedAt)}
            />
          ) : null}
          {club.deletedAt ? (
            <InfoRow
              colors={colors}
              label="Removido em"
              value={getDateLabel(club.deletedAt)}
            />
          ) : null}
        </View>
      </Section>
    </View>
  );
}

function Section({ colors, iconName, title, children }: SectionProps) {
  return (
    <View style={[styles.section, { borderBottomColor: colors.cardBorder }]}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name={iconName} size={19} color={colors.green} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function InfoRow({ colors, label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    borderBottomWidth: 1,
    paddingBottom: 16,
    marginBottom: 16,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    minHeight: 30,
    maxWidth: '48%',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
  },
  infoStack: {
    gap: 9,
  },
  infoRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
});
