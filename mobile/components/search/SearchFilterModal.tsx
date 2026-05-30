import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { SearchThemeColors } from '../../constants/searchTheme';
import type { SearchFilters } from '../../types/search';

type Props = {
  visible: boolean;
  filters: SearchFilters;
  colors: SearchThemeColors;
  onApply: (filters: SearchFilters) => void;
  onClear: () => void;
  onClose: () => void;
};

type DraftFilters = {
  minLevel: string;
  maxLevel: string;
  onlineOnly: boolean;
  publicClubsOnly: boolean;
  clubTag: string;
};

const EMPTY_DRAFT_FILTERS: DraftFilters = {
  minLevel: '',
  maxLevel: '',
  onlineOnly: false,
  publicClubsOnly: false,
  clubTag: '',
};

function numberToInput(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
    ? String(value)
    : '';
}

function parseLevel(value: string) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return Math.max(0, Math.floor(numericValue));
}

function filtersToDraft(filters: SearchFilters): DraftFilters {
  return {
    minLevel: numberToInput(filters.minLevel),
    maxLevel: numberToInput(filters.maxLevel),
    onlineOnly: Boolean(filters.onlineOnly),
    publicClubsOnly: filters.clubVisibility === 'public',
    clubTag: filters.clubTag ?? '',
  };
}

function draftToFilters(draft: DraftFilters): SearchFilters {
  return {
    minLevel: draft.minLevel.trim() ? parseLevel(draft.minLevel) : null,
    maxLevel: draft.maxLevel.trim() ? parseLevel(draft.maxLevel) : null,
    onlineOnly: draft.onlineOnly,
    clubVisibility: draft.publicClubsOnly ? 'public' : undefined,
    clubTag: draft.clubTag.trim() || null,
  };
}

export default function SearchFilterModal({
  visible,
  filters,
  colors,
  onApply,
  onClear,
  onClose,
}: Props) {
  const [draft, setDraft] = useState<DraftFilters>(() =>
    filtersToDraft(filters),
  );

  useEffect(() => {
    if (visible) {
      setDraft(filtersToDraft(filters));
    }
  }, [filters, visible]);

  function updateDraft(nextDraft: Partial<DraftFilters>) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ...nextDraft,
    }));
  }

  function handleApply() {
    onApply(draftToFilters(draft));
    onClose();
  }

  function handleClear() {
    setDraft(EMPTY_DRAFT_FILTERS);
    onClear();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar filtros de busca"
          style={styles.backdrop}
          onPress={onClose}
        />

        <View
          accessibilityRole="text"
          accessibilityLabel="Filtros avancados de busca"
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View
              style={[styles.handle, { backgroundColor: colors.outline }]}
            />
          </View>

          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={[styles.title, { color: colors.text }]}>
                Filtros
              </Text>
              <Text style={[styles.subtitle, { color: colors.subText }]}>
                Refine usuarios e clubes encontrados.
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar filtros"
              hitSlop={8}
              style={({ pressed }) => [
                styles.iconButton,
                { backgroundColor: colors.surfaceStrong },
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons name="close" size={20} color={colors.subText} />
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Nivel de usuario
            </Text>

            <View style={styles.levelRow}>
              <View
                style={[
                  styles.levelInputWrap,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <Text style={[styles.inputLabel, { color: colors.subText }]}>
                  Minimo
                </Text>
                <TextInput
                  accessibilityLabel="Nivel minimo de usuario"
                  value={draft.minLevel}
                  onChangeText={(value) =>
                    updateDraft({ minLevel: value.replace(/[^0-9]/g, '') })
                  }
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  selectionColor={colors.green}
                  style={[styles.levelInput, { color: colors.text }]}
                />
              </View>

              <View
                style={[
                  styles.levelInputWrap,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <Text style={[styles.inputLabel, { color: colors.subText }]}>
                  Maximo
                </Text>
                <TextInput
                  accessibilityLabel="Nivel maximo de usuario"
                  value={draft.maxLevel}
                  onChangeText={(value) =>
                    updateDraft({ maxLevel: value.replace(/[^0-9]/g, '') })
                  }
                  keyboardType="number-pad"
                  placeholder="99"
                  placeholderTextColor={colors.muted}
                  selectionColor={colors.green}
                  style={[styles.levelInput, { color: colors.text }]}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <FilterToggle
              label="Apenas usuarios online"
              value={draft.onlineOnly}
              colors={colors}
              onToggle={() => updateDraft({ onlineOnly: !draft.onlineOnly })}
            />

            <FilterToggle
              label="Apenas clubes publicos"
              value={draft.publicClubsOnly}
              colors={colors}
              onToggle={() =>
                updateDraft({ publicClubsOnly: !draft.publicClubsOnly })
              }
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Tag ou categoria
            </Text>
            <View
              style={[
                styles.tagInputWrap,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <MaterialIcons name="sell" size={18} color={colors.muted} />
              <TextInput
                accessibilityLabel="Tag ou categoria de clube"
                value={draft.clubTag}
                onChangeText={(value) => updateDraft({ clubTag: value })}
                placeholder="Ex: noite, escola, desafios"
                placeholderTextColor={colors.muted}
                selectionColor={colors.green}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.tagInput, { color: colors.text }]}
              />
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={handleClear}
              accessibilityRole="button"
              accessibilityLabel="Limpar filtros"
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  backgroundColor: colors.surfaceSoft,
                  borderColor: colors.cardBorder,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.secondaryText, { color: colors.text }]}>
                Limpar filtros
              </Text>
            </Pressable>

            <Pressable
              onPress={handleApply}
              accessibilityRole="button"
              accessibilityLabel="Aplicar filtros"
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: colors.red },
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons name="check" size={18} color={colors.white} />
              <Text style={[styles.primaryText, { color: colors.white }]}>
                Aplicar
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type FilterToggleProps = {
  label: string;
  value: boolean;
  colors: SearchThemeColors;
  onToggle: () => void;
};

function FilterToggle({ label, value, colors, onToggle }: FilterToggleProps) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      style={({ pressed }) => [
        styles.toggleRow,
        {
          backgroundColor: colors.surfaceSoft,
          borderColor: value ? colors.green : colors.cardBorder,
        },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.toggleLabel, { color: colors.text }]}>
        {label}
      </Text>
      <View
        style={[
          styles.toggleTrack,
          { backgroundColor: value ? colors.green : colors.surfaceStrong },
        ]}
      >
        <View
          style={[
            styles.toggleThumb,
            {
              backgroundColor: colors.white,
              transform: [{ translateX: value ? 18 : 0 }],
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 18,
  },
  handleWrap: {
    alignItems: 'center',
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  levelRow: {
    flexDirection: 'row',
    gap: 10,
  },
  levelInputWrap: {
    flex: 1,
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  levelInput: {
    minHeight: 32,
    fontSize: 18,
    fontWeight: '900',
    padding: 0,
  },
  toggleRow: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  toggleTrack: {
    width: 42,
    height: 24,
    borderRadius: 999,
    padding: 3,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 999,
  },
  tagInputWrap: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    minHeight: 52,
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 0,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: '900',
  },
  primaryText: {
    fontSize: 13,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
