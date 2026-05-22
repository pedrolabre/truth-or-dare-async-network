import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_CREATE_GROUP_ICON_NAME,
  isCreateGroupIconName,
} from '../constants/createGroupIcons';
import {
  CREATE_GROUP_TAG_MAX_COUNT,
  CREATE_GROUP_TAG_MAX_LENGTH,
  isCreateGroupTagOption,
  normalizeCreateGroupTag,
} from '../constants/createGroupTags';
import {
  CREATE_GROUP_DESCRIPTION_MAX_LENGTH,
  CREATE_GROUP_NAME_MAX_LENGTH,
  CREATE_GROUP_NAME_MIN_LENGTH,
  CREATE_GROUP_RULES_MAX_LENGTH,
} from './useCreateGroupScreen';
import { updateClub } from '../services/clubsApi';
import { publishMyClubsUpsert } from '../services/clubsLocalUpdates';
import type { ClubDetail } from '../types/clubs';
import type {
  ClubDetailsApi,
  ClubIconNameApi,
  ClubVisibilityApi,
  UpdateClubPayloadApi,
} from '../types/clubsApi';

type SubmitUpdateClub = (
  clubId: string,
  payload: UpdateClubPayloadApi,
) => Promise<ClubDetailsApi>;

type UseClubSettingsOptions = {
  club: ClubDetail | null;
  visible: boolean;
  canEdit: boolean;
  submitUpdateClub?: SubmitUpdateClub;
  onUpdated?: (clubDetails: ClubDetailsApi) => void;
};

const GROUP_NAME_ALLOWED_PATTERN = /^[\p{L}\p{N} .,'&()!?:_-]+$/u;

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message
    ? error.message
    : fallbackMessage;
}

function normalizeOptionalText(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
}

function getNameValidationMessage(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return 'Informe o nome do clube.';
  }

  if (trimmedName.length < CREATE_GROUP_NAME_MIN_LENGTH) {
    return 'Use pelo menos 3 caracteres.';
  }

  if (trimmedName.length > CREATE_GROUP_NAME_MAX_LENGTH) {
    return 'Use no maximo 80 caracteres.';
  }

  if (!GROUP_NAME_ALLOWED_PATTERN.test(trimmedName)) {
    return 'Use letras, numeros, espacos e pontuacao simples.';
  }

  return null;
}

function getTextMaxLengthMessage(
  value: string,
  maxLength: number,
) {
  if (value.length > maxLength) {
    return `Use no maximo ${maxLength} caracteres.`;
  }

  return null;
}

function normalizeTags(tags: string[]) {
  return Array.from(new Set(tags.map(normalizeCreateGroupTag))).filter(
    (tag) => tag.length > 0 && tag.length <= CREATE_GROUP_TAG_MAX_LENGTH,
  );
}

export function useClubSettings({
  club,
  visible,
  canEdit,
  submitUpdateClub = updateClub,
  onUpdated,
}: UseClubSettingsOptions) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [visibility, setVisibility] =
    useState<ClubVisibilityApi>('public');
  const [selectedIcon, setSelectedIcon] = useState<ClubIconNameApi>(
    DEFAULT_CREATE_GROUP_ICON_NAME,
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(
    null,
  );
  const latestClubIdRef = useRef<string | null>(null);
  const wasVisibleRef = useRef(false);

  const resetFromClub = useCallback((nextClub: ClubDetail) => {
    setName(nextClub.name);
    setDescription(nextClub.descriptionText);
    setRules(nextClub.rules ?? '');
    setVisibility(nextClub.visibility);
    setSelectedIcon(
      isCreateGroupIconName(nextClub.iconName)
        ? nextClub.iconName
        : DEFAULT_CREATE_GROUP_ICON_NAME,
    );
    setSelectedTags(normalizeTags(nextClub.tags));
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);
  }, []);

  useEffect(() => {
    if (!club) {
      latestClubIdRef.current = null;
      wasVisibleRef.current = visible;
      return;
    }

    const shouldResetForClubChange = latestClubIdRef.current !== club.id;
    const shouldResetForOpen = visible && !wasVisibleRef.current;

    if (shouldResetForClubChange || shouldResetForOpen) {
      latestClubIdRef.current = club.id;
      resetFromClub(club);
    }

    wasVisibleRef.current = visible;
  }, [club, resetFromClub, visible]);

  const nameError = useMemo(() => getNameValidationMessage(name), [name]);
  const descriptionError = useMemo(
    () =>
      getTextMaxLengthMessage(
        description,
        CREATE_GROUP_DESCRIPTION_MAX_LENGTH,
      ),
    [description],
  );
  const rulesError = useMemo(
    () =>
      getTextMaxLengthMessage(rules, CREATE_GROUP_RULES_MAX_LENGTH),
    [rules],
  );

  const canSave =
    Boolean(club) &&
    canEdit &&
    !isSaving &&
    nameError === null &&
    descriptionError === null &&
    rulesError === null &&
    isCreateGroupIconName(selectedIcon);

  function selectIcon(iconName: ClubIconNameApi) {
    if (!isCreateGroupIconName(iconName)) {
      return;
    }

    setSelectedIcon(iconName);
  }

  function toggleTag(value: string) {
    const normalizedTag = normalizeCreateGroupTag(value);

    if (
      !isCreateGroupTagOption(normalizedTag) ||
      normalizedTag.length > CREATE_GROUP_TAG_MAX_LENGTH
    ) {
      return;
    }

    setSelectedTags((currentTags) => {
      if (currentTags.includes(normalizedTag)) {
        return currentTags.filter((tag) => tag !== normalizedTag);
      }

      if (currentTags.length >= CREATE_GROUP_TAG_MAX_COUNT) {
        return currentTags;
      }

      return [...currentTags, normalizedTag];
    });
  }

  const buildPayload = useCallback((): UpdateClubPayloadApi => {
    return {
      name: name.trim(),
      description: normalizeOptionalText(description),
      iconName: selectedIcon,
      visibility,
      rules: normalizeOptionalText(rules),
      tags: normalizeTags(selectedTags),
    };
  }, [description, name, rules, selectedIcon, selectedTags, visibility]);

  async function handleSave() {
    if (!club || !canSave) {
      return null;
    }

    setIsSaving(true);
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);

    try {
      const updatedClub = await submitUpdateClub(club.id, buildPayload());

      onUpdated?.(updatedClub);

      if (updatedClub.viewerMembership.isMember) {
        publishMyClubsUpsert(updatedClub);
      }

      setSaveSuccessMessage('Configuracoes salvas.');
      setName(updatedClub.name);
      setDescription(updatedClub.description ?? '');
      setRules(updatedClub.rules ?? '');
      setVisibility(updatedClub.visibility);
      setSelectedIcon(
        isCreateGroupIconName(updatedClub.iconName)
          ? updatedClub.iconName
          : DEFAULT_CREATE_GROUP_ICON_NAME,
      );
      setSelectedTags(normalizeTags(updatedClub.tags));

      return updatedClub;
    } catch (error) {
      setSaveErrorMessage(
        getErrorMessage(error, 'Nao foi possivel salvar as configuracoes.'),
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  function clearSaveFeedback() {
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);
  }

  return {
    name,
    description,
    rules,
    visibility,
    selectedIcon,
    selectedTags,
    nameError,
    descriptionError,
    rulesError,
    descriptionCharacterCount: description.length,
    descriptionMaxLength: CREATE_GROUP_DESCRIPTION_MAX_LENGTH,
    rulesCharacterCount: rules.length,
    rulesMaxLength: CREATE_GROUP_RULES_MAX_LENGTH,
    tagMaxCount: CREATE_GROUP_TAG_MAX_COUNT,
    isSaving,
    saveErrorMessage,
    saveSuccessMessage,
    canSave,
    setName,
    setDescription,
    setRules,
    setVisibility,
    selectIcon,
    toggleTag,
    buildPayload,
    handleSave,
    clearSaveFeedback,
  };
}
