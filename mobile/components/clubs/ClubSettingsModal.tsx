import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { ClubsThemeColors } from '../../constants/clubsTheme';
import { useClubSettings } from '../../hooks/useClubSettings';
import type { ClubDetail } from '../../types/clubs';
import type { ClubDetailsApi } from '../../types/clubsApi';
import ClubEditIdentityForm from './ClubEditIdentityForm';

type Props = {
  visible: boolean;
  club: ClubDetail | null;
  canEdit: boolean;
  colors: ClubsThemeColors;
  onClose: () => void;
  onUpdated: (clubDetails: ClubDetailsApi) => void;
};

export default function ClubSettingsModal({
  visible,
  club,
  canEdit,
  colors,
  onClose,
  onUpdated,
}: Props) {
  const settings = useClubSettings({
    club,
    visible,
    canEdit,
    onUpdated,
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <MaterialIcons name="settings" size={22} color={colors.green} />
              <Text style={[styles.title, { color: colors.text }]}>
                Configuracoes
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar configuracoes"
              onPress={onClose}
              hitSlop={10}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          {!canEdit || !club ? (
            <View style={styles.lockedState}>
              <View
                style={[
                  styles.lockedIcon,
                  { backgroundColor: colors.surfaceSoft },
                ]}
              >
                <MaterialIcons
                  name="lock-outline"
                  size={28}
                  color={colors.muted}
                />
              </View>
              <Text style={[styles.lockedTitle, { color: colors.text }]}>
                Acesso restrito
              </Text>
              <Text style={[styles.lockedText, { color: colors.subText }]}>
                Apenas owner e admin podem editar o clube.
              </Text>
            </View>
          ) : (
            <>
              {settings.saveErrorMessage ? (
                <FeedbackBanner
                  colors={colors}
                  tone="danger"
                  message={settings.saveErrorMessage}
                />
              ) : null}

              {settings.saveSuccessMessage ? (
                <FeedbackBanner
                  colors={colors}
                  tone="success"
                  message={settings.saveSuccessMessage}
                />
              ) : null}

              {settings.mediaErrorMessage ? (
                <FeedbackBanner
                  colors={colors}
                  tone="danger"
                  message={settings.mediaErrorMessage}
                />
              ) : null}

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <ClubEditIdentityForm
                  colors={colors}
                  name={settings.name}
                  description={settings.description}
                  rules={settings.rules}
                  visibility={settings.visibility}
                  selectedIcon={settings.selectedIcon}
                  selectedTags={settings.selectedTags}
                  avatarPreviewUri={
                    settings.avatarDraft?.localUri ?? settings.avatarUrl
                  }
                  coverPreviewUri={
                    settings.coverDraft?.localUri ?? settings.coverUrl
                  }
                  isUploadingAvatar={settings.isUploadingAvatar}
                  isUploadingCover={settings.isUploadingCover}
                  nameError={settings.nameError}
                  descriptionError={settings.descriptionError}
                  rulesError={settings.rulesError}
                  descriptionCharacterCount={settings.descriptionCharacterCount}
                  descriptionMaxLength={settings.descriptionMaxLength}
                  rulesCharacterCount={settings.rulesCharacterCount}
                  rulesMaxLength={settings.rulesMaxLength}
                  tagMaxCount={settings.tagMaxCount}
                  onChangeName={settings.setName}
                  onChangeDescription={settings.setDescription}
                  onChangeRules={settings.setRules}
                  onChangeVisibility={settings.setVisibility}
                  onSelectIcon={settings.selectIcon}
                  onToggleTag={settings.toggleTag}
                  onPickAvatarCamera={settings.pickAvatarFromCamera}
                  onPickAvatarGallery={settings.pickAvatarFromGallery}
                  onRemoveAvatar={settings.removeAvatar}
                  onPickCoverCamera={settings.pickCoverFromCamera}
                  onPickCoverGallery={settings.pickCoverFromGallery}
                  onRemoveCover={settings.removeCover}
                />
              </ScrollView>

              <View style={styles.footerRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    {
                      backgroundColor: colors.surfaceSoft,
                      borderColor: colors.cardBorder,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[styles.secondaryButtonText, { color: colors.muted }]}
                  >
                    Fechar
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !settings.canSave }}
                  disabled={!settings.canSave}
                  onPress={() => {
                    void settings.handleSave();
                  }}
                  testID="club-settings-save"
                  style={({ pressed }) => [
                    styles.saveButton,
                    {
                      backgroundColor: settings.canSave
                        ? colors.green
                        : colors.surfaceStrong,
                    },
                    pressed && settings.canSave && styles.pressed,
                  ]}
                >
                  {settings.isSaving ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <MaterialIcons
                      name="save"
                      size={18}
                      color={settings.canSave ? colors.white : colors.muted}
                    />
                  )}
                  <Text
                    style={[
                      styles.saveButtonText,
                      {
                        color: settings.canSave ? colors.white : colors.muted,
                      },
                    ]}
                  >
                    Salvar
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type FeedbackBannerProps = {
  colors: ClubsThemeColors;
  tone: 'danger' | 'success';
  message: string;
};

function FeedbackBanner({ colors, tone, message }: FeedbackBannerProps) {
  const isDanger = tone === 'danger';

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isDanger ? colors.redSoft : colors.greenSoft,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <Text
        style={[
          styles.bannerText,
          { color: isDanger ? colors.red : colors.green },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 22,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    maxHeight: 520,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '900',
  },
  saveButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '900',
  },
  lockedState: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  lockedIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  lockedText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
  banner: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bannerText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});
