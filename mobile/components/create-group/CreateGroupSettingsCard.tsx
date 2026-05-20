import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  CREATE_GROUP_TAG_OPTIONS,
  type CreateGroupTagOption,
} from '../../constants/createGroupTags';
import type { CreateGroupThemeColors } from '../../constants/createGroupTheme';
import type { ClubVisibilityApi } from '../../types/clubsApi';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

type VisibilityOption = {
  helper: string;
  icon: MaterialIconName;
  label: string;
  value: ClubVisibilityApi;
};

const VISIBILITY_OPTIONS = [
  {
    helper: 'Aberto para descobrir',
    icon: 'public',
    label: 'Publico',
    value: 'public',
  },
  {
    helper: 'Visivel com acesso restrito',
    icon: 'lock',
    label: 'Privado',
    value: 'private',
  },
  {
    helper: 'Entrada por convite',
    icon: 'mail',
    label: 'Convite',
    value: 'invite_only',
  },
] as const satisfies readonly VisibilityOption[];

type Props = {
  colors: CreateGroupThemeColors;
  rules: string;
  rulesCharacterCount: number;
  rulesError: string | null;
  rulesMaxLength: number;
  selectedTags: string[];
  tagMaxCount: number;
  visibility: ClubVisibilityApi;
  onChangeRules: (value: string) => void;
  onChangeVisibility: (value: ClubVisibilityApi) => void;
  onToggleTag: (value: string) => void;
};

export default function CreateGroupSettingsCard({
  colors,
  rules,
  rulesCharacterCount,
  rulesError,
  rulesMaxLength,
  selectedTags,
  tagMaxCount,
  visibility,
  onChangeRules,
  onChangeVisibility,
  onToggleTag,
}: Props) {
  return (
    <View
      style={[
        styles.settingsCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.outline,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="tune" size={20} color={colors.green} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Configuracoes
          </Text>
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={[styles.fieldLabel, { color: colors.green }]}>
          Privacidade
        </Text>

        <View style={styles.visibilityGrid}>
          {VISIBILITY_OPTIONS.map((option) => {
            const isSelected = option.value === visibility;

            return (
              <Pressable
                key={option.value}
                onPress={() => onChangeVisibility(option.value)}
                style={({ pressed }) => [
                  styles.visibilityOption,
                  {
                    backgroundColor: isSelected
                      ? colors.green
                      : colors.background,
                    borderColor: isSelected ? colors.green : colors.outline,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <MaterialIcons
                  name={option.icon}
                  size={20}
                  color={isSelected ? colors.white : colors.green}
                />

                <View style={styles.visibilityTextWrap}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.visibilityLabel,
                      { color: isSelected ? colors.white : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.visibilityHelper,
                      { color: isSelected ? colors.white : colors.subText },
                    ]}
                  >
                    {option.helper}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelRow}>
          <Text style={[styles.fieldLabel, { color: colors.green }]}>
            Regras do Clube
          </Text>
          <Text
            style={[
              styles.counterText,
              { color: rulesError ? colors.red : colors.muted },
            ]}
          >
            {rulesCharacterCount}/{rulesMaxLength}
          </Text>
        </View>

        <TextInput
          value={rules}
          onChangeText={onChangeRules}
          placeholder="Combinados, limites e preferencias do clube."
          placeholderTextColor={colors.muted}
          multiline
          maxLength={rulesMaxLength}
          textAlignVertical="top"
          style={[
            styles.textarea,
            {
              backgroundColor: colors.background,
              borderColor: rulesError ? colors.red : colors.outline,
              color: colors.text,
            },
          ]}
        />

        <Text
          style={[
            styles.fieldHelper,
            { color: rulesError ? colors.red : colors.muted },
          ]}
        >
          {rulesError ?? 'Opcional.'}
        </Text>
      </View>

      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelRow}>
          <Text style={[styles.fieldLabel, { color: colors.green }]}>
            Categorias
          </Text>
          <Text style={[styles.counterText, { color: colors.muted }]}>
            {selectedTags.length}/{tagMaxCount}
          </Text>
        </View>

        <View style={styles.tagGrid}>
          {CREATE_GROUP_TAG_OPTIONS.map((tag) => {
            return (
              <TagChip
                key={tag.value}
                colors={colors}
                disabled={
                  selectedTags.length >= tagMaxCount &&
                  !selectedTags.includes(tag.value)
                }
                isSelected={selectedTags.includes(tag.value)}
                tag={tag}
                onToggleTag={onToggleTag}
              />
            );
          })}
        </View>

        <Text style={[styles.fieldHelper, { color: colors.muted }]}>
          Ate 10 categorias.
        </Text>
      </View>
    </View>
  );
}

type TagChipProps = {
  colors: CreateGroupThemeColors;
  disabled: boolean;
  isSelected: boolean;
  tag: CreateGroupTagOption;
  onToggleTag: (value: string) => void;
};

function TagChip({
  colors,
  disabled,
  isSelected,
  tag,
  onToggleTag,
}: TagChipProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => onToggleTag(tag.value)}
      style={({ pressed }) => [
        styles.tagChip,
        {
          backgroundColor: isSelected ? colors.green : colors.background,
          borderColor: isSelected ? colors.green : colors.outline,
          opacity: disabled ? 0.45 : 1,
        },
        pressed && !disabled && styles.pressed,
      ]}
    >
      {isSelected ? (
        <MaterialIcons name="check" size={14} color={colors.white} />
      ) : null}
      <Text
        numberOfLines={1}
        style={[
          styles.tagChipText,
          { color: isSelected ? colors.white : colors.text },
        ]}
      >
        {tag.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  settingsCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  visibilityGrid: {
    gap: 8,
  },
  visibilityOption: {
    minHeight: 68,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  visibilityTextWrap: {
    flex: 1,
    gap: 2,
  },
  visibilityLabel: {
    fontSize: 14,
    fontWeight: '900',
  },
  visibilityHelper: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  textarea: {
    minHeight: 118,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  fieldHelper: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '900',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    minHeight: 38,
    maxWidth: '48%',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagChipText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});
