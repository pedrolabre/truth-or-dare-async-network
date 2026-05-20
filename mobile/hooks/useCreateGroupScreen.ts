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
import type { ClubVisibilityApi } from '../types/clubsApi';
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

type UseCreateGroupScreenOptions = {
  searchUsers?: SearchUsers;
  memberSearchDebounceMs?: number;
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

export function useCreateGroupScreen({
  searchUsers = getUsers,
  memberSearchDebounceMs = CREATE_GROUP_MEMBER_SEARCH_DEBOUNCE_MS,
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
  const latestMemberSearchId = useRef(0);

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

  function buildPayload(): CreateGroupSubmitPayload {
    const trimmedDescription = description.trim();
    const trimmedRules = rules.trim();

    return {
      name: name.trim(),
      description: trimmedDescription ? trimmedDescription : null,
      iconName: selectedIcon,
      visibility,
      rules: trimmedRules ? trimmedRules : null,
      tags: Array.from(new Set(selectedTags.map(normalizeCreateGroupTag))),
      initialMemberIds: Array.from(new Set(selectedMembers)),
    };
  }

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
    buildPayload,
  };
}
