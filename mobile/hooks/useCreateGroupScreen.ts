import { useMemo, useState } from 'react';
import {
  DEFAULT_CREATE_GROUP_ICON_NAME,
  isCreateGroupIconName,
} from '../constants/createGroupIcons';
import type {
  CreateGroupFriend,
  CreateGroupSubmitPayload,
  GroupIconName,
} from '../types/createGroup';

export const CREATE_GROUP_NAME_MIN_LENGTH = 3;
export const CREATE_GROUP_NAME_MAX_LENGTH = 80;
export const CREATE_GROUP_DESCRIPTION_MAX_LENGTH = 280;
export const CREATE_GROUP_DESCRIPTION_RECOMMENDED_MIN_LENGTH = 20;

const GROUP_NAME_ALLOWED_PATTERN = /^[\p{L}\p{N} .,'&()!?:_-]+$/u;

function normalize(value: string) {
  return value.trim().toLowerCase();
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

const CREATE_GROUP_FRIENDS_MOCK: CreateGroupFriend[] = [
  {
    id: 'friend-ana',
    name: 'Ana Souza',
    username: '@ana',
  },
  {
    id: 'friend-bruno',
    name: 'Bruno Lima',
    username: '@bruno',
  },
  {
    id: 'friend-carla',
    name: 'Carla Mendes',
    username: '@carla',
  },
];

export function useCreateGroupScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [friendQuery, setFriendQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<GroupIconName>(
    DEFAULT_CREATE_GROUP_ICON_NAME,
  );
  const [iconModalVisible, setIconModalVisible] = useState(false);

  const filteredFriends = useMemo(() => {
    const query = normalize(friendQuery);

    if (!query) {
      return CREATE_GROUP_FRIENDS_MOCK;
    }

    return CREATE_GROUP_FRIENDS_MOCK.filter((friend) => {
      return (
        normalize(friend.name).includes(query) ||
        normalize(friend.username).includes(query)
      );
    });
  }, [friendQuery]);

  const nameError = useMemo(() => getNameValidationMessage(name), [name]);
  const descriptionError = useMemo(
    () => getDescriptionValidationMessage(description),
    [description],
  );
  const descriptionWarning = useMemo(
    () => getDescriptionWarningMessage(description),
    [description],
  );
  const selectedCount = selectedMembers.length;
  const canCreate =
    nameError === null &&
    descriptionError === null &&
    isCreateGroupIconName(selectedIcon);

  function toggleMember(id: string) {
    setSelectedMembers((current) =>
      current.includes(id)
        ? current.filter((memberId) => memberId !== id)
        : [...current, id],
    );
  }

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

  function buildPayload(): CreateGroupSubmitPayload {
    const trimmedDescription = description.trim();

    return {
      name: name.trim(),
      description: trimmedDescription ? trimmedDescription : null,
      iconName: selectedIcon,
      visibility: 'public',
      rules: null,
      tags: [],
      initialMemberIds: Array.from(new Set(selectedMembers)),
    };
  }

  return {
    name,
    description,
    friendQuery,
    selectedMembers,
    selectedIcon,
    iconModalVisible,
    filteredFriends,
    selectedCount,
    nameError,
    descriptionError,
    descriptionWarning,
    descriptionCharacterCount: description.length,
    descriptionMaxLength: CREATE_GROUP_DESCRIPTION_MAX_LENGTH,
    canCreate,
    setName,
    setDescription,
    setFriendQuery,
    toggleMember,
    openIconModal,
    closeIconModal,
    selectIcon,
    buildPayload,
  };
}
