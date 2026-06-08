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
import { getUsers, type ChallengeUser } from '../services/api';
import { createClub, updateClub } from '../services/clubsApi';
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
import type {
  ClubDetailsApi,
  ClubVisibilityApi,
  UpdateClubPayloadApi,
} from '../types/clubsApi';
import type {
  CreateGroupMemberOption,
  CreateGroupSubmitPayload,
  GroupIconName,
} from '../types/createGroup';

export const CREATE_GROUP_NAME_MIN_LENGTH = 3;
export const CREATE_GROUP_NAME_MAX_LENGTH = 80;
export const CREATE_GROUP_DESCRIPTION_MAX_LENGTH = 280;
export const CREATE_GROUP_DESCRIPTION_RECOMMENDED_MIN_LENGTH = 20;
export const CREATE_GROUP_RULES_MAX_LENGTH = 2000;
export const CREATE_GROUP_MEMBER_SEARCH_DEBOUNCE_MS = 350;

const GROUP_NAME_ALLOWED_PATTERN = /^[\p{L}\p{N} .,'&()!?:_-]+$/u;

type SearchUsers = (query?: string) => Promise<ChallengeUser[]>;
type SubmitCreateClub = (
  payload: CreateGroupSubmitPayload,
) => Promise<ClubDetailsApi>;
type SubmitUpdateClub = (
  clubId: string,
  payload: UpdateClubPayloadApi,
) => Promise<ClubDetailsApi>;
type PickClubImage = (
  options?: MediaPickerImageOptions,
) => Promise<PickedImageFile | null>;
type UploadClubMedia = typeof uploadAppFile;
type ClubMediaTarget = 'avatar' | 'cover';

type UseCreateGroupScreenOptions = {
  searchUsers?: SearchUsers;
  memberSearchDebounceMs?: number;
  submitCreateClub?: SubmitCreateClub;
  submitUpdateClub?: SubmitUpdateClub;
  uploadFile?: UploadClubMedia;
  pickCameraImage?: PickClubImage;
  pickGalleryImage?: PickClubImage;
};

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

function getDescriptionValidationMessage(description: string) {
  if (description.length > CREATE_GROUP_DESCRIPTION_MAX_LENGTH) {
    return 'Use no maximo 280 caracteres.';
  }

  return null;
}

function getDescriptionWarningMessage(description: string) {
  const trimmedDescription = description.trim();

  if (
    trimmedDescription.length > 0 &&
    trimmedDescription.length < CREATE_GROUP_DESCRIPTION_RECOMMENDED_MIN_LENGTH
  ) {
    return 'Dica: uma descricao com pelo menos 20 caracteres ajuda o clube a ficar claro.';
  }

  return null;
}

function getRulesValidationMessage(rules: string) {
  if (rules.length > CREATE_GROUP_RULES_MAX_LENGTH) {
    return 'Use no maximo 2000 caracteres.';
  }

  return null;
}

function mapUsersToMemberOptions(
  users: ChallengeUser[],
): CreateGroupMemberOption[] {
  const seenIds = new Set<string>();
  const members: CreateGroupMemberOption[] = [];

  users.forEach((user) => {
    if (seenIds.has(user.id)) {
      return;
    }

    seenIds.add(user.id);
    members.push({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  });

  return members;
}

function getCreateGroupApiErrorMessage(error: unknown) {
  const message =
    error instanceof Error && error.message ? error.message : null;

  if (!message) {
    return 'Nao foi possivel criar o clube agora. Tente novamente.';
  }

  return `Nao foi possivel criar o clube. ${message}`;
}

function getClubMediaPickerErrorMessage(error: unknown) {
  if (error instanceof MediaPickerError) {
    return error.message;
  }

  return 'Nao foi possivel selecionar a midia do clube agora.';
}

function getClubMediaUploadErrorMessage(target: ClubMediaTarget) {
  return target === 'avatar'
    ? 'Clube criado, mas o avatar nao foi enviado. Voce pode tentar novamente nas configuracoes.'
    : 'Clube criado, mas a capa nao foi enviada. Voce pode tentar novamente nas configuracoes.';
}

function omitMediaDrafts(
  payload: CreateGroupSubmitPayload,
): CreateGroupSubmitPayload {
  const { avatarDraft, coverDraft, ...createPayload } = payload;

  return createPayload;
}

export function useCreateGroupScreen({
  searchUsers = getUsers,
  memberSearchDebounceMs = CREATE_GROUP_MEMBER_SEARCH_DEBOUNCE_MS,
  submitCreateClub = createClub,
  submitUpdateClub = updateClub,
  uploadFile = uploadAppFile,
  pickCameraImage = pickImageFromCamera,
  pickGalleryImage = pickImageFromGallery,
}: UseCreateGroupScreenOptions = {}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<ClubVisibilityApi>('public');
  const [rules, setRules] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [friendQuery, setFriendQuery] = useState('');
  const [memberOptions, setMemberOptions] = useState<
    CreateGroupMemberOption[]
  >([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [memberSearchError, setMemberSearchError] = useState<string | null>(
    null,
  );
  const [memberSearchRetryKey, setMemberSearchRetryKey] = useState(0);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<GroupIconName>(
    DEFAULT_CREATE_GROUP_ICON_NAME,
  );
  const [iconModalVisible, setIconModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);
  const [hasCreateGroupRetryPayload, setHasCreateGroupRetryPayload] =
    useState(false);
  const [avatarDraft, setAvatarDraft] = useState<PickedImageFile | null>(null);
  const [coverDraft, setCoverDraft] = useState<PickedImageFile | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadingMediaTarget, setUploadingMediaTarget] =
    useState<ClubMediaTarget | null>(null);
  const [mediaErrorMessage, setMediaErrorMessage] = useState<string | null>(
    null,
  );
  const latestMemberSearchId = useRef(0);
  const isSubmittingRef = useRef(false);
  const lastValidPayloadRef = useRef<CreateGroupSubmitPayload | null>(null);

  useEffect(() => {
    const query = friendQuery.trim();
    const searchId = latestMemberSearchId.current + 1;
    let isActive = true;

    latestMemberSearchId.current = searchId;
    setIsLoadingMembers(true);
    setMemberSearchError(null);

    const timeout = setTimeout(() => {
      void (async () => {
        try {
          const users = await searchUsers(query);

          if (!isActive || latestMemberSearchId.current !== searchId) {
            return;
          }

          setMemberOptions(mapUsersToMemberOptions(users));
          setMemberSearchError(null);
        } catch (error) {
          if (!isActive || latestMemberSearchId.current !== searchId) {
            return;
          }

          const message =
            error instanceof Error && error.message
              ? error.message
              : 'Nao foi possivel carregar usuarios.';

          setMemberSearchError(message);
        } finally {
          if (isActive && latestMemberSearchId.current === searchId) {
            setIsLoadingMembers(false);
          }
        }
      })();
    }, memberSearchDebounceMs);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [friendQuery, memberSearchDebounceMs, memberSearchRetryKey, searchUsers]);

  const nameError = useMemo(() => getNameValidationMessage(name), [name]);
  const descriptionError = useMemo(
    () => getDescriptionValidationMessage(description),
    [description],
  );
  const descriptionWarning = useMemo(
    () => getDescriptionWarningMessage(description),
    [description],
  );
  const rulesError = useMemo(() => getRulesValidationMessage(rules), [rules]);
  const selectedCount = selectedMembers.length;
  const canCreate =
    nameError === null &&
    descriptionError === null &&
    rulesError === null &&
    isCreateGroupIconName(selectedIcon);

  function toggleMember(id: string) {
    setSelectedMembers((current) => {
      const uniqueMembers = Array.from(new Set(current));

      return uniqueMembers.includes(id)
        ? uniqueMembers.filter((memberId) => memberId !== id)
        : [...uniqueMembers, id];
    });
  }

  const retryMemberSearch = useCallback(() => {
    setMemberSearchRetryKey((current) => current + 1);
  }, []);

  function openIconModal() {
    setIconModalVisible(true);
  }

  function closeIconModal() {
    setIconModalVisible(false);
  }

  function selectIcon(icon: GroupIconName) {
    if (!isCreateGroupIconName(icon)) {
      return;
    }

    setSelectedIcon(icon);
    setIconModalVisible(false);
  }

  async function pickClubMedia(
    target: ClubMediaTarget,
    source: 'camera' | 'gallery',
  ) {
    if (isSubmitting || isUploadingMedia) {
      return;
    }

    setMediaErrorMessage(null);

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

  function removeAvatarDraft() {
    if (isSubmitting || isUploadingMedia) {
      return;
    }

    setAvatarDraft(null);
    setMediaErrorMessage(null);
  }

  function removeCoverDraft() {
    if (isSubmitting || isUploadingMedia) {
      return;
    }

    setCoverDraft(null);
    setMediaErrorMessage(null);
  }

  function toggleTag(value: string) {
    const normalizedTag = normalizeCreateGroupTag(value);

    if (
      !isCreateGroupTagOption(normalizedTag) ||
      normalizedTag.length > CREATE_GROUP_TAG_MAX_LENGTH
    ) {
      return;
    }

    setSelectedTags((current) => {
      if (current.includes(normalizedTag)) {
        return current.filter((tag) => tag !== normalizedTag);
      }

      if (current.length >= CREATE_GROUP_TAG_MAX_COUNT) {
        return current;
      }

      return [...current, normalizedTag];
    });
  }

  const buildPayload = useCallback((): CreateGroupSubmitPayload => {
    const trimmedDescription = description.trim();
    const trimmedRules = rules.trim();
    const payload: CreateGroupSubmitPayload = {
      name: name.trim(),
      description: trimmedDescription ? trimmedDescription : null,
      iconName: selectedIcon,
      visibility,
      rules: trimmedRules ? trimmedRules : null,
      tags: Array.from(new Set(selectedTags.map(normalizeCreateGroupTag))),
      initialMemberIds: Array.from(new Set(selectedMembers)),
    };

    if (avatarDraft) {
      payload.avatarDraft = avatarDraft;
    }

    if (coverDraft) {
      payload.coverDraft = coverDraft;
    }

    return payload;
  }, [
    avatarDraft,
    coverDraft,
    description,
    name,
    rules,
    selectedIcon,
    selectedMembers,
    selectedTags,
    visibility,
  ]);

  const uploadCreatedClubMedia = useCallback(
    async (
      createdClub: ClubDetailsApi,
      payload: CreateGroupSubmitPayload,
    ): Promise<ClubDetailsApi> => {
      const mediaPayload: UpdateClubPayloadApi = {};
      let mediaError: string | null = null;

      async function uploadDraft(
        target: ClubMediaTarget,
        draft: PickedImageFile,
      ) {
        setUploadingMediaTarget(target);

        const uploadedMedia = await uploadFile({
          localUri: draft.localUri,
          fileName: draft.fileName,
          mimeType: draft.mimeType,
          usage: target === 'avatar' ? 'club-avatar' : 'club-cover',
          entityId: createdClub.id,
          sizeBytes: draft.sizeBytes,
        });

        return uploadedMedia.fileUrl;
      }

      if (!payload.avatarDraft && !payload.coverDraft) {
        return createdClub;
      }

      setIsUploadingMedia(true);
      setMediaErrorMessage(null);

      try {
        if (payload.avatarDraft) {
          try {
            mediaPayload.avatarUrl = await uploadDraft(
              'avatar',
              payload.avatarDraft,
            );
          } catch {
            mediaError = getClubMediaUploadErrorMessage('avatar');
          }
        }

        if (payload.coverDraft) {
          try {
            mediaPayload.coverUrl = await uploadDraft('cover', payload.coverDraft);
          } catch {
            mediaError = getClubMediaUploadErrorMessage('cover');
          }
        }

        if (Object.keys(mediaPayload).length === 0) {
          setMediaErrorMessage(mediaError);
          return createdClub;
        }

        setUploadingMediaTarget(null);
        const updatedClub = await submitUpdateClub(createdClub.id, mediaPayload);

        if (!mediaError) {
          setAvatarDraft(null);
          setCoverDraft(null);
        }

        setMediaErrorMessage(mediaError);

        return updatedClub;
      } catch {
        setMediaErrorMessage(
          'Clube criado, mas nao foi possivel salvar as midias. Tente novamente nas configuracoes.',
        );
        return createdClub;
      } finally {
        setIsUploadingMedia(false);
        setUploadingMediaTarget(null);
      }
    },
    [submitUpdateClub, uploadFile],
  );

  const submitPayload = useCallback(
    async (payload: CreateGroupSubmitPayload) => {
      if (isSubmittingRef.current) {
        return null;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setCreateGroupError(null);

      try {
        const createdClub = await submitCreateClub(omitMediaDrafts(payload));

        return uploadCreatedClubMedia(createdClub, payload);
      } catch (error) {
        setCreateGroupError(getCreateGroupApiErrorMessage(error));
        return null;
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [submitCreateClub, uploadCreatedClubMedia],
  );

  const handleCreateGroup = useCallback(async () => {
    if (!canCreate) {
      return null;
    }

    const payload = buildPayload();

    lastValidPayloadRef.current = payload;
    setHasCreateGroupRetryPayload(true);

    return submitPayload(payload);
  }, [buildPayload, canCreate, submitPayload]);

  const retryCreateGroup = useCallback(async () => {
    const payload = lastValidPayloadRef.current;

    if (!payload) {
      return null;
    }

    return submitPayload(payload);
  }, [submitPayload]);

  return {
    name,
    description,
    visibility,
    rules,
    selectedTags,
    friendQuery,
    selectedMembers,
    selectedIcon,
    iconModalVisible,
    memberOptions,
    isLoadingMembers,
    memberSearchError,
    isSubmitting,
    createGroupError,
    avatarDraft,
    coverDraft,
    isUploadingMedia,
    uploadingMediaTarget,
    mediaErrorMessage,
    selectedCount,
    nameError,
    descriptionError,
    descriptionWarning,
    descriptionCharacterCount: description.length,
    descriptionMaxLength: CREATE_GROUP_DESCRIPTION_MAX_LENGTH,
    rulesError,
    rulesCharacterCount: rules.length,
    rulesMaxLength: CREATE_GROUP_RULES_MAX_LENGTH,
    tagMaxCount: CREATE_GROUP_TAG_MAX_COUNT,
    canCreate,
    isUploadingAvatar:
      isUploadingMedia && uploadingMediaTarget === 'avatar',
    isUploadingCover:
      isUploadingMedia && uploadingMediaTarget === 'cover',
    canRetryCreateGroup:
      hasCreateGroupRetryPayload && !isSubmitting && !isUploadingMedia,
    setName,
    setDescription,
    setVisibility,
    setRules,
    setFriendQuery,
    toggleMember,
    retryMemberSearch,
    toggleTag,
    openIconModal,
    closeIconModal,
    selectIcon,
    pickAvatarFromCamera: () => pickClubMedia('avatar', 'camera'),
    pickAvatarFromGallery: () => pickClubMedia('avatar', 'gallery'),
    pickCoverFromCamera: () => pickClubMedia('cover', 'camera'),
    pickCoverFromGallery: () => pickClubMedia('cover', 'gallery'),
    removeAvatarDraft,
    removeCoverDraft,
    clearMediaErrorMessage: () => setMediaErrorMessage(null),
    buildPayload,
    handleCreateGroup,
    retryCreateGroup,
  };
}
