import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CREATE_GROUP_ICON_OPTIONS } from '../../constants/createGroupIcons';
import {
  CREATE_GROUP_TAG_OPTIONS,
  type CreateGroupTagOption,
} from '../../constants/createGroupTags';
import type { ClubsThemeColors } from '../../constants/clubsTheme';
import type {
  ClubIconNameApi,
  ClubVisibilityApi,
} from '../../types/clubsApi';
import EditableImageField from '../media/EditableImageField';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

type VisibilityOption = {
  icon: MaterialIconName;
  label: string;
  value: ClubVisibilityApi;
};

const VISIBILITY_OPTIONS = [
  {
    icon: 'public',
    label: 'Publico',
    value: 'public',
  },
  {
    icon: 'lock',
    label: 'Privado',
    value: 'private',
  },
  {
    icon: 'mail',
    label: 'Convite',
    value: 'invite_only',
  },
] as const satisfies readonly VisibilityOption[];

type Props = {
  colors: ClubsThemeColors;
  name: string;
  description: string;
  rules: string;
  visibility: ClubVisibilityApi;
  selectedIcon: ClubIconNameApi;
  selectedTags: string[];
  avatarPreviewUri?: string | null;
  coverPreviewUri?: string | null;
  isUploadingAvatar?: boolean;
  isUploadingCover?: boolean;
  nameError: string | null;
  descriptionError: string | null;
  rulesError: string | null;
  descriptionCharacterCount: number;
  descriptionMaxLength: number;
  rulesCharacterCount: number;
  rulesMaxLength: number;
  tagMaxCount: number;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeRules: (value: string) => void;
  onChangeVisibility: (value: ClubVisibilityApi) => void;
  onSelectIcon: (value: ClubIconNameApi) => void;
  onToggleTag: (value: string) => void;
  onPickAvatarCamera: () => void;
  onPickAvatarGallery: () => void;
  onRemoveAvatar: () => void;
  onPickCoverCamera: () => void;
  onPickCoverGallery: () => void;
  onRemoveCover: () => void;
};

export default function ClubEditIdentityForm({
  colors,
  name,
  description,
  rules,
  visibility,
  selectedIcon,
  selectedTags,
  avatarPreviewUri,
  coverPreviewUri,
  isUploadingAvatar = false,
  isUploadingCover = false,
  nameError,
  descriptionError,
  rulesError,
  descriptionCharacterCount,
  descriptionMaxLength,
  rulesCharacterCount,
  rulesMaxLength,
  tagMaxCount,
  onChangeName,
  onChangeDescription,
  onChangeRules,
  onChangeVisibility,
  onSelectIcon,
  onToggleTag,
  onPickAvatarCamera,
  onPickAvatarGallery,
  onRemoveAvatar,
  onPickCoverCamera,
  onPickCoverGallery,
  onRemoveCover,
}: Props) {
  const showNameError = name.length > 0 && nameError !== null;
  const mediaColors = {
    surface: colors.surface,
    surfaceSoft: colors.surfaceSoft,
    border: colors.cardBorder,
    outline: colors.cardBorder,
    text: colors.text,
    muted: colors.muted,
    green: colors.green,
    red: colors.red,
    white: colors.white,
  };

  return (
    <View testID="club-edit-identity-form" style={styles.form}>
      <View style={styles.mediaFields}>
        <EditableImageField
          colors={mediaColors}
          title="Avatar"
          helperText="Imagem quadrada exibida em listas e no perfil."
          imageUri={avatarPreviewUri}
          variant="avatar"
          fallbackIconName={selectedIcon}
          isUploading={isUploadingAvatar}
          loadingLabel="Enviando avatar..."
          onCamera={onPickAvatarCamera}
          onGallery={onPickAvatarGallery}
          onRemove={onRemoveAvatar}
        />

        <EditableImageField
          colors={mediaColors}
          title="Capa"
          helperText="Imagem horizontal exibida no topo do clube."
          imageUri={coverPreviewUri}
          variant="cover"
          fallbackIconName="panorama"
          isUploading={isUploadingCover}
          loadingLabel="Enviando capa..."
          onCamera={onPickCoverCamera}
          onGallery={onPickCoverGallery}
          onRemove={onRemoveCover}
        />
      </View>

      <View style={styles.fieldBlock}>
        <Text style={[styles.fieldLabel, { color: colors.green }]}>
          Nome
        </Text>
        <TextInput
          value={name}
          onChangeText={onChangeName}
          placeholder="Nome do clube"
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceSoft,
              borderColor: showNameError ? colors.red : colors.cardBorder,
              color: colors.text,
            },
          ]}
        />
        <Text
          style={[
            styles.helperText,
            { color: showNameError ? colors.red : colors.muted },
          ]}
        >
          {showNameError ? nameError : '3 a 80 caracteres.'}
        </Text>
      </View>

      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelRow}>
          <Text style={[styles.fieldLabel, { color: colors.green }]}>
            Descricao
          </Text>
          <Text
            style={[
              styles.counterText,
              { color: descriptionError ? colors.red : colors.muted },
            ]}
          >
            {descriptionCharacterCount}/{descriptionMaxLength}
          </Text>
        </View>
        <TextInput
          value={description}
          onChangeText={onChangeDescription}
          placeholder="O que define este clube?"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={descriptionMaxLength}
          textAlignVertical="top"
          style={[
            styles.textarea,
            {
              backgroundColor: colors.surfaceSoft,
              borderColor: descriptionError ? colors.red : colors.cardBorder,
              color: colors.text,
            },
          ]}
        />
        <Text
          style={[
            styles.helperText,
            { color: descriptionError ? colors.red : colors.muted },
          ]}
        >
          {descriptionError ?? 'Opcional.'}
        </Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={[styles.fieldLabel, { color: colors.green }]}>
          Icone
        </Text>
        <View style={styles.iconGrid}>
          {CREATE_GROUP_ICON_OPTIONS.map((icon) => {
            const isSelected = icon === selectedIcon;

            return (
              <Pressable
                key={icon}
                onPress={() => onSelectIcon(icon)}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: isSelected
                      ? colors.green
                      : colors.surfaceSoft,
                    borderColor: isSelected ? colors.green : colors.cardBorder,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <MaterialIcons
                  name={icon}
                  size={24}
                  color={isSelected ? colors.white : colors.text}
                />
              </Pressable>
            );
          })}
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
                  styles.visibilityButton,
                  {
                    backgroundColor: isSelected
                      ? colors.green
                      : colors.surfaceSoft,
                    borderColor: isSelected ? colors.green : colors.cardBorder,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <MaterialIcons
                  name={option.icon}
                  size={18}
                  color={isSelected ? colors.white : colors.green}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.visibilityText,
                    { color: isSelected ? colors.white : colors.text },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelRow}>
          <Text style={[styles.fieldLabel, { color: colors.green }]}>
            Regras
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
          placeholder="Combinados e limites do clube."
          placeholderTextColor={colors.muted}
          multiline
          maxLength={rulesMaxLength}
          textAlignVertical="top"
          style={[
            styles.textarea,
            {
              backgroundColor: colors.surfaceSoft,
              borderColor: rulesError ? colors.red : colors.cardBorder,
              color: colors.text,
            },
          ]}
        />
        <Text
          style={[
            styles.helperText,
            { color: rulesError ? colors.red : colors.muted },
          ]}
        >
          {rulesError ?? 'Opcional.'}
        </Text>
      </View>

      <View style={styles.fieldBlock}>
        <View style={styles.fieldLabelRow}>
          <Text style={[styles.fieldLabel, { color: colors.green }]}>
            Tags
          </Text>
          <Text style={[styles.counterText, { color: colors.muted }]}>
            {selectedTags.length}/{tagMaxCount}
          </Text>
        </View>
        <View style={styles.tagGrid}>
          {CREATE_GROUP_TAG_OPTIONS.map((tag) => (
            <TagChip
              key={tag.value}
              colors={colors}
              tag={tag}
              isSelected={selectedTags.includes(tag.value)}
              disabled={
                selectedTags.length >= tagMaxCount &&
                !selectedTags.includes(tag.value)
              }
              onToggleTag={onToggleTag}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

type TagChipProps = {
  colors: ClubsThemeColors;
  tag: CreateGroupTagOption;
  isSelected: boolean;
  disabled: boolean;
  onToggleTag: (value: string) => void;
};

function TagChip({
  colors,
  tag,
  isSelected,
  disabled,
  onToggleTag,
}: TagChipProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => onToggleTag(tag.value)}
      style={({ pressed }) => [
        styles.tagChip,
        {
          backgroundColor: isSelected ? colors.green : colors.surfaceSoft,
          borderColor: isSelected ? colors.green : colors.cardBorder,
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
          styles.tagText,
          { color: isSelected ? colors.white : colors.text },
        ]}
      >
        {tag.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 18,
  },
  mediaFields: {
    gap: 16,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  input: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  textarea: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  counterText: {
    fontSize: 11,
    fontWeight: '900',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibilityGrid: {
    gap: 8,
  },
  visibilityButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  visibilityText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    minHeight: 36,
    maxWidth: '48%',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  tagText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});
