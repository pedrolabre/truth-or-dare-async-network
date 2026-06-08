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
import {
  CLUB_AVATAR_PICKER_OPTIONS,
  CLUB_COVER_PICKER_OPTIONS,
  MediaPickerError,
  pickImageFromCamera,
  pickImageFromGallery,
  type MediaPickerImageOptions,
  type PickedImageFile,
} from '../services/mediaPicker';
import { uploadAppFile } from '../services/uploads';
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
type PickClubImage = (
  options?: MediaPickerImageOptions,
) => Promise<PickedImageFile | null>;
type UploadClubMedia = typeof uploadAppFile;
type ClubMediaTarget = 'avatar' | 'cover';

type UseClubSettingsOptions = {
  club: ClubDetail | null;
  visible: boolean;
  canEdit: boolean;
  submitUpdateClub?: SubmitUpdateClub;
  uploadFile?: UploadClubMedia;
  pickCameraImage?: PickClubImage;
  pickGalleryImage?: PickClubImage;
  onUpdated?: (clubDetails: ClubDetailsApi) => void;
};

const GROUP_NAME_ALLOWED_PATTERN = /^[\p{L}\p{N} .,'&()!?:_-]+$/u;

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message
    ? error.message
    : fallbackMessage;
}

function getClubMediaPickerErrorMessage(error: unknown) {
  if (error instanceof MediaPickerError) {
    return error.message;
  }

  return 'Nao foi possivel selecionar a midia do clube agora.';
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
  uploadFile = uploadAppFile,
  pickCameraImage = pickImageFromCamera,
  pickGalleryImage = pickImageFromGallery,
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [avatarDraft, setAvatarDraft] = useState<PickedImageFile | null>(null);
  const [coverDraft, setCoverDraft] = useState<PickedImageFile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadingMediaTarget, setUploadingMediaTarget] =
    useState<ClubMediaTarget | null>(null);
  const [mediaErrorMessage, setMediaErrorMessage] = useState<string | null>(
    null,
  );
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(
    null,
  );
  const latestClubIdRef = useRef<string | null>(null);
  const initialAvatarUrlRef = useRef<string | null>(null);
  const initialCoverUrlRef = useRef<string | null>(null);
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
    setAvatarUrl(nextClub.avatarUrl);
    setCoverUrl(nextClub.coverUrl);
    setAvatarDraft(null);
    setCoverDraft(null);
    initialAvatarUrlRef.current = nextClub.avatarUrl;
    initialCoverUrlRef.current = nextClub.coverUrl;
    setMediaErrorMessage(null);
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
    !isUploadingMedia &&
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

  async function pickClubMedia(
    target: ClubMediaTarget,
    source: 'camera' | 'gallery',
  ) {
    if (!canEdit || isSaving || isUploadingMedia) {
      return;
    }

    setMediaErrorMessage(null);
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);

    try {
      const options =
        target === 'avatar'
          ? CLUB_AVATAR_PICKER_OPTIONS
          : CLUB_COVER_PICKER_OPTIONS;
      const pickedImage =
        source === 'camera'
          ? await pickCameraImage(options)
          : await pickGalleryImage(options);

      if (!pickedImage) {
        return;
      }

      if (target === 'avatar') {
        setAvatarDraft(pickedImage);
      } else {
        setCoverDraft(pickedImage);
      }
    } catch (error) {
      setMediaErrorMessage(getClubMediaPickerErrorMessage(error));
    }
  }

  function removeAvatar() {
    if (!canEdit || isSaving || isUploadingMedia) {
      return;
    }

    setAvatarUrl(null);
    setAvatarDraft(null);
    setMediaErrorMessage(null);
    setSaveSuccessMessage(null);
  }

  function removeCover() {
    if (!canEdit || isSaving || isUploadingMedia) {
      return;
    }

    setCoverUrl(null);
    setCoverDraft(null);
    setMediaErrorMessage(null);
    setSaveSuccessMessage(null);
  }

  const buildPayload = useCallback(
    (
      mediaOverrides: Partial<
        Pick<UpdateClubPayloadApi, 'avatarUrl' | 'coverUrl'>
      > = {},
    ): UpdateClubPayloadApi => {
      const payload: UpdateClubPayloadApi = {
        name: name.trim(),
        description: normalizeOptionalText(description),
        iconName: selectedIcon,
        visibility,
        rules: normalizeOptionalText(rules),
        tags: normalizeTags(selectedTags),
      };
      const nextAvatarUrl =
        'avatarUrl' in mediaOverrides
          ? mediaOverrides.avatarUrl ?? null
          : avatarUrl;
      const nextCoverUrl =
        'coverUrl' in mediaOverrides
          ? mediaOverrides.coverUrl ?? null
          : coverUrl;

      if (nextAvatarUrl !== initialAvatarUrlRef.current) {
        payload.avatarUrl = nextAvatarUrl;
      }

      if (nextCoverUrl !== initialCoverUrlRef.current) {
        payload.coverUrl = nextCoverUrl;
      }

      return payload;
    },
    [
      avatarUrl,
      coverUrl,
      description,
      name,
      rules,
      selectedIcon,
      selectedTags,
      visibility,
    ],
  );

  async function uploadDraft(
    target: ClubMediaTarget,
    draft: PickedImageFile,
  ) {
    if (!club) {
      throw new Error('Clube nao identificado para atualizar midia.');
    }

    setUploadingMediaTarget(target);

    const uploadedMedia = await uploadFile({
      localUri: draft.localUri,
      fileName: draft.fileName,
      mimeType: draft.mimeType,
      usage: target === 'avatar' ? 'club-avatar' : 'club-cover',
      entityId: club.id,
      sizeBytes: draft.sizeBytes,
    });

    return uploadedMedia.fileUrl;
  }

  async function handleSave() {
    if (!club || !canSave) {
      return null;
    }

    setIsSaving(true);
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);
    setMediaErrorMessage(null);

    try {
      let nextAvatarUrl = avatarUrl;
      let nextCoverUrl = coverUrl;

      if (avatarDraft || coverDraft) {
        setIsUploadingMedia(true);
      }

      if (avatarDraft) {
        nextAvatarUrl = await uploadDraft('avatar', avatarDraft);
      }

      if (coverDraft) {
        nextCoverUrl = await uploadDraft('cover', coverDraft);
      }

      setUploadingMediaTarget(null);

      const updatedClub = await submitUpdateClub(
        club.id,
        buildPayload({
          avatarUrl: nextAvatarUrl,
          coverUrl: nextCoverUrl,
        }),
      );

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
      setAvatarUrl(updatedClub.avatarUrl);
      setCoverUrl(updatedClub.coverUrl);
      setAvatarDraft(null);
      setCoverDraft(null);
      initialAvatarUrlRef.current = updatedClub.avatarUrl;
      initialCoverUrlRef.current = updatedClub.coverUrl;

      return updatedClub;
    } catch (error) {
      const isMediaSave = Boolean(avatarDraft || coverDraft);
      const message = isMediaSave
        ? 'Nao foi possivel enviar as midias do clube. Tente novamente.'
        : getErrorMessage(
            error,
            'Nao foi possivel salvar as configuracoes.',
          );

      if (isMediaSave) {
        setMediaErrorMessage(message);
      }

      setSaveErrorMessage(message);
      return null;
    } finally {
      setIsSaving(false);
      setIsUploadingMedia(false);
      setUploadingMediaTarget(null);
    }
  }

  function clearSaveFeedback() {
    setMediaErrorMessage(null);
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
    avatarUrl,
    coverUrl,
    avatarDraft,
    coverDraft,
    nameError,
    descriptionError,
    rulesError,
    descriptionCharacterCount: description.length,
    descriptionMaxLength: CREATE_GROUP_DESCRIPTION_MAX_LENGTH,
    rulesCharacterCount: rules.length,
    rulesMaxLength: CREATE_GROUP_RULES_MAX_LENGTH,
    tagMaxCount: CREATE_GROUP_TAG_MAX_COUNT,
    isSaving,
    isUploadingMedia,
    uploadingMediaTarget,
    isUploadingAvatar:
      isUploadingMedia && uploadingMediaTarget === 'avatar',
    isUploadingCover:
      isUploadingMedia && uploadingMediaTarget === 'cover',
    mediaErrorMessage,
    saveErrorMessage,
    saveSuccessMessage,
    canSave,
    setName,
    setDescription,
    setRules,
    setVisibility,
    selectIcon,
    toggleTag,
    pickAvatarFromCamera: () => pickClubMedia('avatar', 'camera'),
    pickAvatarFromGallery: () => pickClubMedia('avatar', 'gallery'),
    pickCoverFromCamera: () => pickClubMedia('cover', 'camera'),
    pickCoverFromGallery: () => pickClubMedia('cover', 'gallery'),
    removeAvatar,
    removeCover,
    buildPayload,
    handleSave,
    clearSaveFeedback,
  };
}
