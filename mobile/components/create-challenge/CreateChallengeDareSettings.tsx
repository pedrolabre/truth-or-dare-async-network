import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  maxAttempts: number;
  onChangeMaxAttempts: (value: number) => void;

  durationMinutes: number;
  onChangeDurationMinutes: (value: number) => void;

  COLORS: any;
};

const ATTEMPT_OPTIONS = [1, 3, 5, 7, 9];
const DURATION_OPTIONS = [15, 30, 60, 120]; // minutos

export default function CreateChallengeDareSettings({
  maxAttempts,
  onChangeMaxAttempts,
  durationMinutes,
  onChangeDurationMinutes,
  COLORS,
}: Props) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: COLORS.surfaceContainerLow,
          borderColor: COLORS.outlineVariant,
        },
      ]}
    >
      <Text style={[styles.label, { color: COLORS.outline }]}>
        CONFIGURAÇÕES DO DESAFIO
      </Text>

      {/* MAX ATTEMPTS */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: COLORS.onSurface }]}>
          Tentativas
        </Text>

        <View style={styles.optionsRow}>
          {ATTEMPT_OPTIONS.map((value) => {
            const selected = value === maxAttempts;

            return (
              <Pressable
                key={value}
                onPress={() => onChangeMaxAttempts(value)}
                style={[
                  styles.option,
                  {
                    backgroundColor: selected
                      ? COLORS.primary
                      : COLORS.surfaceContainer,
                    borderColor: COLORS.outlineVariant,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected ? COLORS.onPrimary : COLORS.onSurface,
                    fontWeight: '700',
                  }}
                >
                  {value}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* DURATION */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: COLORS.onSurface }]}>
          Tempo limite
        </Text>

        <View style={styles.optionsRow}>
          {DURATION_OPTIONS.map((value) => {
            const selected = value === durationMinutes;

            return (
              <Pressable
                key={value}
                onPress={() => onChangeDurationMinutes(value)}
                style={[
                  styles.option,
                  {
                    backgroundColor: selected
                      ? COLORS.primary
                      : COLORS.surfaceContainer,
                    borderColor: COLORS.outlineVariant,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected ? COLORS.onPrimary : COLORS.onSurface,
                    fontWeight: '700',
                  }}
                >
                  {value}m
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
});